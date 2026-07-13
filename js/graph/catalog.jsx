// js/graph/catalog.jsx — the Tab quick-add node catalog: per-nodedef info,
// grouping a category's nodedefs into type signatures (versions collapsed
// under their signature), and the memoized catalog builder. Split out of
// js/graph-app.jsx (pure move, no behavior change) as part of the graph
// view's file split. Loaded after js/graph/model.jsx in the graph view's
// babelScripts manifest (see js/shell.jsx's VIEW_DEPS.graph). Like every
// other lazy-loaded file in this app, this file has NO top-level import/
// export — it self-exports via a single Object.assign(window, {}) at the
// bottom. `nodeCatalogPromise` is the only module-mutable state left in
// the graph view's split files; it lives here alongside buildNodeCatalog,
// the sole function that touches it.

        // ---- Tab quick-add: the standard-library node catalog -------------

        // One entry per stdlib node category (name, group, signature
        // groups), built once from the loaded library.
        // One nodedef → its raw info: name, resolved output type, the input
        // list (name/type/default — inheritance-resolved via
        // getActiveInputs, so a versioned nodedef that only overrides a
        // couple of defaults still reports its FULL port list), and version
        // metadata. A category with several nodedefs (add, mix, …) can vary
        // along two independent axes — see groupSignatures below, which
        // tells a genuine type SIGNATURE apart from a mere VERSION of the
        // same signature (standard_surface 1.0.1 / 1.0.0: identical ports,
        // different defaults).
        const nodeDefInfo = (def) => {
            const seen = new Set();
            const inputs = [];
            const defIns = vecToArray(mxSafe(() => def.getActiveInputs(), []))
                .concat(vecToArray(mxSafe(() => def.getInputs(), [])));
            for (const dIn of defIns) {
                const nm = mxElName(dIn);
                if (!nm || seen.has(nm)) continue;
                seen.add(nm);
                inputs.push({
                    name: nm, type: mxElType(dIn),
                    value: mxSafe(() => (dIn.getValueString ? dIn.getValueString() : ''), '') || mxElAttr(dIn, 'value'),
                });
            }
            // Modern nodedefs declare their type on <output> children only.
            const outTypes = vecToArray(mxSafe(() => def.getActiveOutputs(), [])).map(mxElType).filter(Boolean);
            const type = mxElType(def)
                || (outTypes.length === 1 ? outTypes[0] : (outTypes.length ? 'multioutput' : ''));
            const outLabel = type === 'multioutput' ? outTypes.join(' + ') : type;
            return {
                name: mxElName(def), type, outLabel, inputs,
                version: mxSafe(() => def.getVersionString(), '') || '',
                isDefaultVersion: !!mxSafe(() => def.getDefaultVersion(), false),
                sig: (inputs.map((i) => i.type).join(', ') || '\u2014') + ' \u2192 ' + (outLabel || '?'),
            };
        };

        // Deduped, order-preserving token list \u2014 "color3, color3, float"
        // becomes "color3, float" \u2014 used for the compact signature label
        // (task 7) exactly like the docs page's uniqTypeTokens.
        const uniqTokens = (arr) => {
            const seen = new Set();
            const out = [];
            arr.forEach((t) => { if (t && !seen.has(t)) { seen.add(t); out.push(t); } });
            return out;
        };

        // A TYPE-SIGNATURE key \u2014 the ordered input types plus the
        // resolved output type \u2014 independent of version. Two nodedefs
        // sharing this key are the SAME signature at different versions;
        // nodedefs with different keys are genuinely different signatures
        // (mix: float vs color3 vs \u2026).
        const sigKeyOf = (d) => d.type + '|' + d.inputs.map((i) => i.type).join(',');

        // Group a category's nodedefs into one entry per TYPE SIGNATURE,
        // each carrying every VERSION of that signature:
        //   { key, type, outLabel, inputs, inSummary, ambiguous, versions }
        // `inputs`/`outLabel` describe the DEFAULT (or first) version \u2014
        // what applySignature retypes/reconciles against; `versions` is
        // sorted default-first, then by version string descending.
        // Ambiguity (the output type alone can't resolve which nodedef to
        // use) is a SIGNATURE-level concern, never a version-level one.
        const groupSignatures = (defs) => {
            const byKey = {};
            const order = [];
            for (const d of defs) {
                const key = sigKeyOf(d);
                if (!byKey[key]) { byKey[key] = []; order.push(key); }
                byKey[key].push(d);
            }
            const groups = order.map((key) => {
                const versions = byKey[key].slice().sort((a, b) => {
                    if (a.isDefaultVersion !== b.isDefaultVersion) return a.isDefaultVersion ? -1 : 1;
                    return b.version.localeCompare(a.version, undefined, { numeric: true });
                });
                const rep = versions[0];
                return {
                    key, type: rep.type, outLabel: rep.outLabel, inputs: rep.inputs,
                    inSummary: uniqTokens(rep.inputs.map((i) => i.type)).join(', '),
                    full: rep.sig, versions,
                };
            });
            const byType = {};
            groups.forEach((g) => { byType[g.type] = (byType[g.type] || 0) + 1; });
            groups.forEach((g) => { g.ambiguous = byType[g.type] > 1; });
            return groups;
        };

        let nodeCatalogPromise = null;
        const buildNodeCatalog = () => {
            if (!nodeCatalogPromise) {
                nodeCatalogPromise = getMxEnv().then(({ stdlib }) => {
                    const byCat = {};
                    for (const def of vecToArray(mxSafe(() => stdlib.getNodeDefs(), []))) {
                        const cat = mxSafe(() => def.getNodeString(), '');
                        if (!cat) continue;
                        const group = mxSafe(() => def.getNodeGroup(), '') || '';
                        const e = byCat[cat] || (byCat[cat] = { category: cat, group, defs: [] });
                        if (!e.group && group) e.group = group;
                        e.defs.push(nodeDefInfo(def)); // library order = the canonical one
                    }
                    return Object.keys(byCat).sort().map((k) => {
                        const e = byCat[k];
                        e.signatures = groupSignatures(e.defs);
                        return e;
                    });
                });
                nodeCatalogPromise.catch(() => { nodeCatalogPromise = null; }); // allow retry
            }
            return nodeCatalogPromise;
        };

Object.assign(window, { buildNodeCatalog, nodeDefInfo, groupSignatures });
