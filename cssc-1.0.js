/**
 * CSSController - Dynamic CSS Controller. 
 *  ↳ CSSC         A way to manage style sheets.
 * 
 * @version 1.0b
 *
 * @author m13p4
 * @copyright Meliantchenkov Pavel
 */
var CSSC = (function()
{ 'use strict';
    
    var VERSION = "1.0b",
        
        TYPE_rule       = 1, //check
        TYPE_charset    = 2, //check
        TYPE_import     = 3, //check
        TYPE_media      = 4, //check
        TYPE_fontFace   = 5, //check
        TYPE_page       = 6, //check
        TYPE_keyframes  = 7, //check
        TYPE_keyframe   = 8, //check
        TYPE_namespace      = 10, //check
        TYPE_counterStyle   = 11, 
        TYPE_supports       = 12, //check
        TYPE_fontFeatureValues = 14,
        TYPE_viewport          = 15,
        TYPE = helperObjectFreeze({
            'rule':      TYPE_rule, 
            'charset':   TYPE_charset, 
            'import':    TYPE_import,
            'media':     TYPE_media, 
            'fontFace':  TYPE_fontFace,
            'page':      TYPE_page,
            'keyframes': TYPE_keyframes,
            'keyframe':  TYPE_keyframe,
            'namespace':    TYPE_namespace,
            'counterStyle': TYPE_counterStyle, 
            'supports':     TYPE_supports,
            'fontFeatureValues': TYPE_fontFeatureValues,
            'viewport':          TYPE_viewport
        }),
        
        TYPE_EXPORT_css         = "css",
        TYPE_EXPORT_min         = "min",
        TYPE_EXPORT_obj         = "obj",
        TYPE_EXPORT_object      = "object", //default
        TYPE_EXPORT_notMDObject = "objNMD", //not MultiDimensional Object
        TYPE_EXPORT_array       = "array",
        TYPE_EXPORT = helperObjectFreeze({
           css:         TYPE_EXPORT_css,
           min:         TYPE_EXPORT_min,
           obj:         TYPE_EXPORT_obj,
           object:      TYPE_EXPORT_object,
           notMDObject: TYPE_EXPORT_notMDObject,
           array:       TYPE_EXPORT_array
        }),
        
        CONF_DEFAULT_styleId = "cssc-style",
        CONF_DEFAULT_viewErr = true,
        CONF_DEFAULT_tabLen  = 2,
        CONF_DEFAULT = helperObjectFreeze({
            styleId: CONF_DEFAULT_styleId,
            viewErr: CONF_DEFAULT_viewErr,
            tabLen: CONF_DEFAULT_tabLen
        }),
        
        INDEX = [{},!0,-1,[],{}],
        MESSAGES = [];
        
    function helperElemType(elem, len, returnFullValue)
    {
        if(returnFullValue) return Object.prototype.toString.call(elem);
        var n = Object.prototype.toString.call(elem).replace(/(^\[.+\s|\]$)/g,"");
        if(n === "Number") n = Math.floor(elem) === elem ? "integer" : "float";
        if(!len) return n;
        return n.substr(0,len);
    }
    function helperObjectAssign()
    {
        if(Object.assign) return Object.assign.apply(null, arguments);
        
        var key, i;
        for(i = 1; i < arguments.length; i++)
            for(key in arguments[i]) 
                arguments[0][key] = arguments[i][key];
        return arguments[0];
    }
    function helperObjectDefineReadOnlyPropertys(obj, propsObj)
    {
        var key;
        
        if(Object.defineProperty) for(key in propsObj)
            Object.defineProperty(obj, key, {
                enumerable: true,
                value: propsObj[key]
            });
        else for(key in propsObj) obj[key] = propsObj[key];
    }
    function helperObjectFreeze(obj)
    {
        if(Object.freeze) return Object.freeze(obj);
        else if(Object.defineProperty)
        {
            var tmp = {}, key;
            for(key in obj) Object.defineProperty(tmp, key, {
                enumerable: true,
                value: obj[key]
            });
            obj = tmp;
        }
        if(Object.preventExtensions) Object.preventExtensions(obj);
        return obj;
    }
    function helperCreateNewStyleElem(index)
    {
        if(document.getElementById(index[4].styleId))
        {
            for(var i = 0; i < 10; i++)
                if(!document.getElementById(index[4].styleId+'-'+i))
                {
                    index[4].styleId = index[4].styleId+'-'+i;
                    break;
                }

            if(document.getElementById(index[4].styleId))
                throw new Error("cann not create new element..");
        }

        var styleElem = document.createElement("style");
        styleElem.setAttribute("type", "text/css");
        styleElem.setAttribute("id", index[4].styleId);
        styleElem.appendChild(document.createTextNode(""));

        document.head.appendChild(styleElem);

        index[1] = styleElem;
    }
    function helperParseValue(value)
    {
        if(isFinite(value))
        {
            if(value%1 === 0) return value + "px";
            return (Math.floor(value * 100) / 100) + "px";
        }
        else if(helperElemType(value, 1) === "S")
        {
            var v = value.split(" ");

            if(v.length > 1)
            {
                for(var i = 0; i < v.length; i++) 
                    v[i] = helperParseValue(v[i]);
                return v.join(" ");
            }
        }
        return value;
    }
    function helperObjFromCssText(cssText)
    {
        if(cssText.match(/^@(namespace|import|charset)/))
            return cssText.replace(/(^@(namespace|import|charset)\s*|\s*;\s*$)/g, "");

        var str = cssText.replace(/(^.*?{\s*|\s*}\s*$)/g, ''),
            split = str.split(';'), i, kv, obj = {};

        if(str !== "")
        {
            for(i = 0; i < split.length; i++)
            {
                if(split[i] === "") continue;

                kv = split[i].split(':');

                obj[kv[0].trim()] = kv.slice(1).join(':').trim();
            }
        }

        return obj;
    }
    function helperCssTextFromObj(obj, min, tabLen, addTab, fromArrayParse)
    {
        var tab = (new Array((parseInt(tabLen)||CONF_DEFAULT_tabLen)+1).join(" ")), 
            cssText = "", key, obKey, elType = helperElemType(obj, 1), i, tmp;

        addTab = addTab || "";

        if(elType === "S") return obj;
        
        if(elType === "A") for(i = 0; i < obj.length; i++)
                cssText += helperCssTextFromObj(obj[i], min, tabLen, addTab, true);
        else
        {
            for(key in obj)
            {
                obKey = obj[key];
                elType = helperElemType(obj[key], 1);

                if(elType === "O" || elType === "A")
                {
                    if(fromArrayParse && elType === "A")
                    {
                        tmp = helperCssTextFromObj(obj[key], min, tabLen, addTab+tab, fromArrayParse);
                        
                        if(tmp === "") continue;
                        
                        if(min) cssText += key.replace(/\s*(,|:)\s*/g,"$1")+"{"+tmp+"}";
                        else    cssText += addTab+key.replace(/\s*,\s*/g, ",\n"+addTab)+" {\n"+tmp+addTab+"}\n";
                        
                        continue;
                    }
                        
                    if(elType === "O") obKey = [obj[key]];

                    for(i = 0; i < obKey.length; i++)
                    {
                        if(key === "@namespace" || key === "@import" || key === "@charset")
                        {
                            cssText += key+" "+obKey[i]+";"+(min?'':"\n");
                            continue;
                        }

                        tmp = helperCssTextFromObj(obKey[i], min, tabLen, addTab+tab, fromArrayParse);

                        if(tmp === "") continue;
                        
                        if(min) cssText += key.replace(/\s*(,|:)\s*/g,"$1")+"{"+tmp+"}";
                        else    cssText += addTab+key.replace(/\s*,\s*/g, ",\n"+addTab)+" {\n"+tmp+addTab+"}\n";
                    }
                }
                else if(key === "@namespace" || key === "@import" || key === "@charset")
                             cssText += key+" "+obKey+";"+(min?'':"\n");
                else if(min) cssText += key+":"+obKey.trim().replace(/\s*,\s*/g,",")+";";
                else         cssText += (addTab.length < tab.length ? tab : addTab)+key+": "+obKey+";\n";
            }
        }
        return cssText;
    }
    function helperFindPropInCssText(cssText, prop)
    {
        var regExp = new RegExp(prop+"\s*:\s*(.+?);"),
            find = cssText.match(regExp);

        return !!find ? find[1].trim() : "";
    }
    function helperSelectorType(sel)
    {
        sel = sel.trim();

        if(sel.charAt(0) !== "@") return TYPE_rule;

        sel = sel.substr(1);

        var selIO = sel.indexOf(" "), key;

        if(selIO >= 0) sel = sel.substr(0, selIO);

        key = sel;

        if(sel.indexOf("-") >= 0)
        {
            var splSel = sel.split("-"), i;

            key = splSel[0];

            for(i = 1; i < splSel.length; i++)
                key += splSel[i].charAt(0).toUpperCase()+splSel[i].substr(1);
        }

        return (key in TYPE) ? TYPE[key] : -1;
    }
    function helperGenSelector(pSel, sel)
    {
        if(sel.charAt(0) === "@" && pSel.charAt(0) === "@")
            sel = sel.substr(1);

        if(sel.charAt(0) === "/")      sel = sel.substr(1);
        else if(sel.charAt(0) === ",") sel = ", "+sel.substr(1).trim();
        else                           sel = " " + sel;

        if(pSel.indexOf(",") >= 0 || sel.indexOf(",") > 0)
        {
            var pSelSplit = pSel.split(","), i, newSel = "",
                selSplit = sel.split(","), j;

            if(sel.charAt(0) !== ",")
                for(i = 0; i < pSelSplit.length; i++)
                    for(j = 0; j < selSplit.length; j++)
                        newSel += pSelSplit[i] + selSplit[j] + ", ";
            else for(i = 0; i < pSelSplit.length; i++)
                    newSel += pSelSplit[i] + sel + ", ";

            return newSel.replace(/,+\s*$/,"");
        }
        return pSel + sel;
    }
    function helperDeleteCSSRule(cssRule)
    {
        var parent = !!cssRule.parentRule ? cssRule.parentRule : cssRule.parentStyleSheet, i;

        for(i = 0; i < parent.cssRules.length; i++) 
            if(parent.cssRules[i] === cssRule)
            {
                parent.deleteRule(i);
                break;
            }
    }
    function helperParseVars(str, vars)
    {
        if(!vars) vars = [{}];
        else if(helperElemType(vars, 1) !== "A") vars = [vars];
        
        if(!str)  str = "";

        var varStart = str.lastIndexOf("$"), varEnd, 
            c = 0, v, i, j, xyz, tmp, key, keySplit, type;

        while(varStart >= 0 && c < 100)
        { c++; v = null;
            
            tmp    = str.substr(varStart+1);
            varEnd = tmp.search(/[^\w\.]/); 

            if(varEnd < 0)  varEnd  = str.length;
            else            varEnd += varStart;

            key = str.substr(varStart+1, varEnd-varStart);
            keySplit = key.split(".");

            for(i = 0; i < keySplit.length; i++)
            {
                if(keySplit[i].length < 1) continue;
                type = helperElemType(v,1);

                if(i === 0)
                {
                    for(j = vars.length-1; j >= 0; j--) 
                        if(keySplit[i] in vars[j])
                        {
                            v = vars[j][keySplit[i]];
                            break;
                        }
                }
                else if(v !== null && type.match(/[OA]/) && keySplit[i] in v) v = v[keySplit[i]];
                else if(type === "S" && keySplit[i].match(/^[0-9]+$/))        v = v.charAt(keySplit[i]);
                else
                {
                    v = "$"+key;
                    break;
                }
                
                if(helperElemType(v,1) === "F")
                {
                    if(str.charAt(varEnd+1) === "(")
                    {
                        varEnd++;

                        tmp = varEnd;
                        xyz = varEnd;

                        do
                        {
                            xyz = str.indexOf("(", xyz+1);
                            varEnd = str.indexOf(")", varEnd+1);
                        }
                        while(xyz > -1 && xyz < varEnd)

                        if(varEnd < 0) varEnd = str.length;

                        tmp = str.substr(tmp+1, varEnd-tmp-1);
                        tmp = tmp.trim().split(/\s*,\s*/);

                        v   = v.apply(null, tmp);
                    }
                    else v = v();
                    
                    if(str.charAt(varEnd+1) === ".")
                    {
                        varEnd++;

                        xyz    = varEnd;
                        tmp    = str.substr(varEnd+1);
                        varEnd = tmp.search(/[^\w\.]/); 
                        tmp    = tmp.substr(0, varEnd < 0 ? tmp.length : varEnd);

                        if(varEnd < 0)  varEnd  = str.length;
                        else            varEnd += xyz;

                        key = str.substr(varStart+1, varEnd-varStart);
                        tmp = tmp.split(".");

                        for(xyz = 0; xyz < tmp.length; xyz++)
                            keySplit.push(tmp[xyz]);
                    }
                }
            }
            str = str.substr(0, varStart) + v + str.substr(varEnd+1);

            if('$'+key === v) varEnd  = varStart;
            else              varEnd += v.length-1;
            
            if(--varEnd < 0) break;
            varStart = str.lastIndexOf("$", varEnd);
        }
        return str;
    }

    function initElements(index, toInit)
    {
        var ignVal;

        toInit = "length" in toInit ? toInit : [toInit];

        for(var i = 0; i < toInit.length; i++)
        {
            if("sheet" in toInit[i]) toInit[i] = toInit[i].sheet;

            if("cssRules" in toInit[i])
            {
                ignVal = (toInit[i].ownerNode.getAttribute('data-cssc-ignore') || "").toLowerCase();

                if(ignVal === "true" || ignVal === "1") continue;

                try
                {
                    indexCssRules(index, toInit[i].cssRules, null);
                }
                catch(err)
                {
                    if(index[4].viewErr) console.log("Cannot init CSS from \""+toInit[i].href+"\"");
                    MESSAGES.push("Cannot init CSS from \""+toInit[i].href+"\"");
                }
            }
        }
    }
    function indexCssRules(index, cssRules, parent)
    {
        for(var i = 0; i < cssRules.length; i++)
            if(cssRules[i] && !!cssRules[i].parentStyleSheet 
            && !!cssRules[i].parentStyleSheet.ownerNode 
            && cssRules[i].parentStyleSheet.ownerNode.id === index[4].styleId)
                addToIndex(index, cssRules[i], parent);
    }
    function addToIndex(index, cssRule, parent, csscSelector)
    {
        var indexKey  = cssRule.cssText.substr(0, cssRule.cssText.indexOf("{")).trim(),
            indexType = cssRule.type, 
            toIndex   = cssRule,
            _index    = parent ? parent.children : index[0],
            indexObjWrapper, indexC;

        //@todo: support all types
        if(indexType !== TYPE_rule 
        && indexType !== TYPE_fontFace 
        && indexType !== TYPE_media
        && indexType !== TYPE_keyframes
        && indexType !== TYPE_keyframe
        && indexType !== TYPE_page
        && indexType !== TYPE_supports
        && indexType !== TYPE_namespace
        && indexType !== TYPE_import
        && indexType !== TYPE_charset)
        {
            console.log("unsuported type: "+indexType);
            return;
        }

        if(indexType === TYPE_namespace) indexKey = "@namespace";
        if(indexType === TYPE_import)    indexKey = "@import";
        if(indexType === TYPE_charset)   indexKey = "@charset";

        toIndex._update = false;
        if(indexType === TYPE_rule) toIndex.style._update = {};

        index[2]++; INDEX[2]++;
        indexObjWrapper = {
            indexElem: toIndex,
            selector: indexKey,
            csscSelector: csscSelector ? csscSelector : indexKey,
            children: false,
            parent: (!!parent ? parent : false),
            events: {},
            obj: {},
            type: indexType,
            p: index[2],
            _p: INDEX[2]
        };

        if(_index[indexKey])
            indexC = (_index[indexKey].content.push(indexObjWrapper) - 1);
        else
        {
            _index[indexKey] = {
                type: indexType,
                content: [indexObjWrapper],
                events: {}
            };

            indexC = 0;
        }

        //handle Media & KeyFrames Rules
        if(indexType === TYPE_media 
        || indexType === TYPE_keyframes 
        || indexType === TYPE_supports)
        {
            _index[indexKey].content[indexC].children = {};

            indexCssRules(index, cssRule.cssRules, _index[indexKey].content[indexC]);
        }
        else
            _index[indexKey].content[indexC].obj = helperObjFromCssText(cssRule.cssText);

        if(!INDEX[0][indexKey]) INDEX[0][indexKey] = {
            type: indexType,
            content: [indexObjWrapper],
            events: {}
        };
        else INDEX[0][indexKey].content.push(indexObjWrapper);

        return indexObjWrapper;
    }
    function createRule(index, selector, property, value, parent)
    {
        var appendToElem;

        if(!parent && !index[1]) helperCreateNewStyleElem(index);
        
        appendToElem = parent ? parent.indexElem : index[1].sheet;

        var rulePos = appendToElem.cssRules.length, ruleString = "";

        if(!!property)
        {
            var propType = helperElemType(property, 1);

            if(propType === "O")
            {
                var prop;

                for(var key in property)
                {
                    if(helperElemType(property[key], 1) === "F")
                    {
                        prop = property[key]();

                        ruleString += key+":"+prop+"; ";
                    }
                    else
                        ruleString += key+":"+property[key]+"; ";
                }
            }
            else if(propType === "F")
            {
                var prop = property();

                for(var key in prop)
                    ruleString += key+":"+prop[key]+"; ";
            }
            else
                ruleString = property+":"+value+";";
        }

        var insRuleString = selector+"{"+ruleString+"}", added = false;

        if(selector === "@namespace" || selector === "@import" || selector === "@charset")
            insRuleString = selector+" "+property;
        
        try
        {
            if("insertRule" in appendToElem)
                appendToElem.insertRule(insRuleString, rulePos);
            else if("appendRule" in appendToElem)
                appendToElem.appendRule(insRuleString, rulePos);
            else if("addRule" in appendToElem)
                appendToElem.addRule(selector, ruleString, rulePos);

            added = addToIndex(index, appendToElem.cssRules[rulePos], parent, selector);
        }
        catch(err)
        {
            var errTxt = (parent ? '"' + parent.selector + '" > ' : '')
                         + "\"" + selector + "\" -> " + err;

            if(index[4].viewErr) console.log(errTxt);
            MESSAGES.push(errTxt);
        }
        
        if(added) return added;
        
        return addToIndex(index, {
            csscSelector: selector,
            cssText: insRuleString,
            parent: parent||false,
            type: helperSelectorType(selector),
            placeholder: true,
            cssRules: {},
            style: {}
        }, parent, key);
    }
    function delFromIndex(index, sel, toDel)
    {
        if(index && index[sel])
        {
            var tmp = (toDel ? index[sel].content.indexOf(toDel) : -1);

            if(!toDel) delete index[sel];
            else if(tmp >= 0)
            {
                index[sel].content.splice(tmp, 1);

                if(index[sel].content.length <= 0) delete index[sel];
            }
        }
    }
    function getHandler(index, sel, getElements)
    {
        var selType = helperElemType(sel,1),
            _index = helperElemType(index,1) === "A" ? index[0] : index; 

        if(selType === "S")
        {
            if(getElements) return _index[sel] ? _index[sel].content : [];
            
            return ruleHandler(index, (_index[sel] ? _index[sel].content : []), sel);
        }
        else if(selType === "R")
        {
            var matches = [], key;

            for(key in _index)
                if(!!key.match(sel))
                    for(i = 0; i < _index[key].content.length; i++)
                        matches.push(_index[key].content[i]);

            if(getElements) return matches;

            return ruleHandler(index, matches, sel);
        }
        else if(selType === "A")
        {
            var matches = [], i, j;

            for(i = 0; i < sel.length; i++)
                if(_index[sel])
                    for(j = 0; j < _index[sel].content.length; j++)
                        matches.push(_index[sel].content[j]);

            if(getElements) return matches;

            return ruleHandler(index, matches, sel);
        }
        else if(selType === "N" || selType === "U")
        {
            var matches = [], key;

            for(key in _index)
                for(i = 0; i < _index[key].content.length; i++)
                    matches.push(_index[key].content[i]);

            if(getElements) return matches;

            return ruleHandler(index, matches, sel);
        }

        return null;
    }
    function handleSelection(index, sel, getElements, _this)
    {
        var selType = helperElemType(sel, 1);

        if(selType === "R" || selType === "U" || selType === "N" || selType === "A" || selType === "S")
             return getHandler(index, sel, getElements);
        else
        {
            handleImport(index, sel);
            return _this;
        }
    }
    function handleImport(index, importObj, parent, isPreImport)
    {
        var importElem, rule, handlerObj, key, i, tmp, preImport = {};

        if(!isPreImport && !parent)
        {
            if("@charset"   in importObj) preImport["@charset"]   = importObj["@charset"];
            if("@import"    in importObj) preImport["@import"]    = importObj["@import"];
            if("@namespace" in importObj) preImport["@namespace"] = importObj["@namespace"];
            if("@font-face" in importObj) preImport["@font-face"] = importObj["@font-face"];

            if(Object.keys(preImport).length > 0) handleImport(index, preImport, parent, true);
        }
        
        for(key in importObj)
        {
            if(key in preImport) continue;
            
            if(helperElemType(importObj[key], 1) === "A")
                importElem = importObj[key];
            else
                importElem = [importObj[key]];

            key = helperParseVars(key, index[3]);

            for(i = 0; i < importElem.length; i++)
            {
                if(key.charAt(0) === "@")
                {
                    if(key === "@font-face" || key === "@namespace" || key === "@import" || key === "@charset")
                        createRule(index, key, importElem[i], null, parent);
                    else if(key.match(/^@(media|keyframes|supports)/) 
                            || (parent && (parent.type === TYPE_media
                                        || parent.type === TYPE_keyframes
                                        || parent.type === TYPE_supports)
                               )
                    )
                    {
                        handlerObj = key,
                        tmp = parent;

                        if(parent && !key.match(/^@(media|keyframes|supports)/))
                        {
                            key = helperGenSelector(parent.csscSelector, key);

                            tmp = parent.parent;
                        }

                        rule = createRule(index, key, null, null, tmp);

                        if(rule && rule.selector === rule.csscSelector)
                            handleImport(index, importElem[i], rule);
                        else
                        {
                            if(rule)
                            {
                                helperDeleteCSSRule(rule.indexElem);
                                delFromIndex(rule.parent ? rule.parent : index[0], rule.selector, rule);
                            }

                            tmp = {
                                csscSelector: key,
                                cssText: key + " {}",
                                parent: tmp || false,
                                placeholder: true,
                                type: helperSelectorType(key),
                                cssRules: {}
                            };

                            rule = addToIndex(index, tmp, tmp.parent, key);

                            handleImport(index, importElem[i], rule);
                        }

                        if(!!parent)
                        {
                            if(!parent.obj[handlerObj]) parent.obj[handlerObj] = [];

                            parent.obj[handlerObj].push(rule);
                        }
                    }
                }
                else
                {
                    rule = createRule(index, key, null, null, parent);

                    if(rule) _set(index, [rule], importElem[i]);
                }
            }
        }
    }
    
    function _set(index, e, prop, val, pos)
    {
        if(helperElemType(pos,1) === "i") // single Set
        {
            if(e[pos].indexElem.type === TYPE_fontFace)
            {
                if(index[4].viewErr)
                    console.log("@font-face rules are readonly.");
                MESSAGES.push("@font-face rules are readonly.");

                return;
            }
            prop = helperParseVars(prop, index[3]);

            if(e[pos].children)
                _set(index, getHandler(e[pos].children, null, true), prop, val);
            else 
            {
                var prsVal, valType = helperElemType(val,1), tmp;

                if(valType === "O" || valType === "A")
                {
                    var isAtRule = prop.charAt(0) === "@", pObj, rule,
                        valArr = valType === 'O' ? [val] : val, i,
                        newSel = helperGenSelector(e[pos].selector, prop);

                    if(isAtRule) newSel = e[pos].parent ? helperGenSelector(e[pos].parent.selector, prop) : prop;

                    for(i = 0; i < valArr.length; i++)
                    {
                        rule = createRule(index, newSel, null, null, isAtRule ? false : e[pos].parent);

                        if(rule)
                        {
                            if(isAtRule) 
                            {
                                tmp = rule;
                                rule = createRule(index, e[pos].selector, null, null, rule);
                                
                                if(!rule) rule = tmp;
                            }

                            _set(index, [rule], valArr[i]);

                            if(isAtRule && e[pos].parent)
                            {
                                pObj = e[pos].parent;

                                if(!pObj.obj[prop] || !("push" in pObj.obj[prop]))
                                    pObj.obj[prop] = [];

                                pObj.obj[prop].push(rule.parent);
                            }

                            if(!e[pos].obj[prop] || !("push" in e[pos].obj[prop]))
                                e[pos].obj[prop] = [];
                            e[pos].obj[prop].push(rule);
                        }
                    }
                }
                else if(valType === "F")
                {
                    var oldVal = _get(index, [e[pos]], prop), valToSet;

                    try
                    {
                        valToSet = val(oldVal);

                        _set(index, e, prop, valToSet, pos);
                        e[pos].indexElem.style._update[prop] = val;
                    }
                    catch(err)
                    {
                        if(index[4].viewErr) console.log(err);
                        MESSAGES.push(err);
                    }
                }
                else
                {
                    prsVal = helperParseValue(val);

                    e[pos].indexElem.style[prop] = prsVal;
                    e[pos].obj[prop] = prsVal;
                }
            }
        }
        else // multi Set
        {
            var i, propLen, key, props,
                propType = helperElemType(prop, 1);

            if(propType === "O")      propLen = Object.keys(prop).length;
            else if(propType === "F") props = prop();

            if(propType === "A" || (propType === "F" && helperElemType(props, 1) === "A"))
            {
                var prp = (propType === "A" ? prop : props);
                for(i = 0; i < prp.length; i++)
                {
                    if(e.length > i) _set(index, [e[i]], prp[i]);
                    else             break;
                }
            }
            else for(i = 0; i < e.length; i++)
            {
                if(propType === "O" && propLen > 0) 
                    for(key in prop) _set(index, e, key, prop[key], i);
                else if(propType === "F")
                {
                    for(key in props)
                        _set(index, e, key, props[key], i);

                    //add to updatable
                    e[i].indexElem._update = prop;
                }
                else _set(index, e, prop, val, i);
            }
        }
        return;
    }
    function _get(index, e, prop, returnAllProps)
    {
        if(!prop) return _export(index, e, TYPE_EXPORT_object);

        var arrToRet = [], propToRet = "", tmp, i;

        returnAllProps = !!returnAllProps;

        for(i = 0; i < e.length; i++)
        {
            tmp = "";

            if(e[i].obj[prop]) 
            {
                tmp = e[i].obj[prop];

                if(helperElemType(tmp, 1) === "A")
                    tmp = _export(index, tmp, TYPE_EXPORT_object);
            }

            if(!tmp || tmp === "")
                tmp = e[i].indexElem.style[prop];
            if(!tmp || tmp === "")
                tmp = helperFindPropInCssText(e[i].indexElem.cssText, prop);

            if(!!tmp)
            {
                propToRet = tmp;

                if(returnAllProps) arrToRet.push(propToRet);
            }
        }
        return returnAllProps ? arrToRet : propToRet;
    }
    function _export(index, e, type, ignore)
    {
        var exportObj = {}, obj, i, j, key, tmp, _type = type;

        if(type === TYPE_EXPORT_obj)
            type = TYPE_EXPORT_object;

        if(type === TYPE_EXPORT_css || type === TYPE_EXPORT_min)
            type = TYPE_EXPORT_array;

        if(!ignore) ignore = [];

        for(i = 0; i < e.length; i++)
        {
            if(ignore.indexOf(e[i]) >= 0) continue; 

            if(e[i].type === TYPE_namespace 
            || e[i].type === TYPE_import 
            || e[i].type === TYPE_charset)
                obj = e[i].obj;
            else
            {
                obj = helperObjectAssign({}, e[i].obj);

                for(key in e[i].obj)
                {
                    if(helperElemType(e[i].obj[key], 1) === "A")
                    {
                        if(type === TYPE_EXPORT_notMDObject || type === TYPE_EXPORT_array)
                        {
                            obj[key] = null;
                            delete obj[key];

                            continue;
                        }

                        obj[key] = [];

                        for(j = 0; j < e[i].obj[key].length; j++)
                        {
                            if(ignore.indexOf(e[i].obj[key][j]) >= 0) continue; 

                            tmp = _export(index, [e[i].obj[key][j]], type, ignore)[e[i].obj[key][j].selector];

                            ignore.push(e[i].obj[key][j]);

                            if(!tmp || Object.keys(tmp).length <= 0) continue;

                            obj[key][j] = tmp;
                        }

                        if(obj[key].length === 0) delete obj[key];
                        else if(obj[key].length === 1) obj[key] = obj[key][0];
                    }
                }
            }

            if(e[i].children)
            {
                obj = helperObjectAssign(_export(index, getHandler(e[i].children, null, true), type, ignore), obj);
            }

            if(Object.keys(obj).length <= 0) continue;

            if(type === TYPE_EXPORT_array)
            {
                exportObj[e[i].p] = {};
                exportObj[e[i].p][e[i].selector] = obj;
            }
            else if(exportObj[e[i].selector])
            {
                if(helperElemType(exportObj[e[i].selector], 1) !== "A")
                    exportObj[e[i].selector] = [exportObj[e[i].selector]];

                exportObj[e[i].selector].push(obj);
            }
            else exportObj[e[i].selector] = obj;

            ignore.push(e[i]);
        }

        if(type === TYPE_EXPORT_array) 
        {   
            exportObj = Object.values(exportObj);
            return type === _type ? exportObj : helperCssTextFromObj(exportObj, _type===TYPE_EXPORT_min, index[4].tabLen);
        }

        var sortExpObj = {};
        if(exportObj['@charset'])   sortExpObj['@charset']   = exportObj['@charset'];
        if(exportObj['@import'])    sortExpObj['@import']    = exportObj['@import'];
        if(exportObj['@namespace']) sortExpObj['@namespace'] = exportObj['@namespace'];
        if(exportObj['@font-face']) sortExpObj['@font-face'] = exportObj['@font-face'];

        tmp = Object.keys(sortExpObj).length > 0;
        if(tmp) for(i in exportObj) if(!sortExpObj[i])
                    sortExpObj[i] = exportObj[i];

        return tmp ? sortExpObj : exportObj;
    }
    function _update(index, e)
    {
        var i, tmp, key;

        for(i = 0; i < e.length; i++)
        {
            if(e[i].indexElem._update !== false)
            {
                tmp = e[i].indexElem._update();

                for(key in tmp) _set(index, e, key, tmp[key], i);
            }

            if(e[i].children)
                _update(index, getHandler(e[i].children, null, true));
            else if(e[i].indexElem.style) 
                for(key in e[i].indexElem.style._update)
                    _set(index, e, key, e[i].indexElem.style._update[key](), i);
        }
        return;
    }
    function _delete(index, e, prop, _this)
    {
        var isUndef = !!helperElemType(prop,1).match(/[NU]/), i, _e = [];

        for(i = 0; i < e.length; i++)
        {
            if(e[i].children) _delete(index, getHandler(e[i].children, null, true), prop, _this);
            
            if(isUndef)
            {
                helperDeleteCSSRule(e[i].indexElem);
                delFromIndex(e[i].parent ? e[i].parent : index[0], e[i].selector, e[i]);
            }
            else
            {
                _e.push(e[i]);
                e[i].indexElem.style[prop] = "";
                
                if(e[i].obj[prop])
                {
                    if(helperElemType(e[i].obj[prop],1) === "A")
                        _delete(index, e[i].obj[prop]);
                    delete e[i].obj[prop];
                }
            }
        }
        
        if(_this) _this.e = _getE(index, _e);
    }
    function _pos(index, e, p, sel, parents)
    {
        if(p < 0) p += e.length;
        if(e[p]) return ruleHandler(index, [e[p]], sel, false, e[p].parent ? e[p].parent : false);
        return ruleHandler(index, [], sel, false, parents);
    }

    function _getE(index, e)
    {
        var _e = [];
        for(var i = 0; i < e.length; i++) 
            if(e[i].indexElem)
                _e.push(e[i].indexElem.placeholder ? _export(index, [e[i]], TYPE_EXPORT_obj) : e[i].indexElem);
        return _e;
    };

    function _selector(e, sel)
    {
        return e.length === 1 ? e[0].selector : sel;
    }
    
    function ruleHandler(index, els, sel, fromHas, parents)
    {
        var handler;
        
        function createRuleIfNotExists()
        {
            if(els.length < 1 && !fromHas && helperElemType(sel,1) === "S")
            {
                var rule, contentElems = [], i, _p = parents ? parents : [null];

                for(i = 0; i < _p.length; i++)
                {
                    rule = createRule(index, sel, null, null, _p[i]);

                    if(rule) contentElems.push(rule);
                }

                els = contentElems;
                handler.e = _getE(index, els);
                handler.selector = _selector(els, sel);
            }
        }
        
        handler = function(sel)
        {
            var i, j, elArr = [], tmp;

            createRuleIfNotExists();

            for(i = 0; i < els.length; i++)
            {
                if(els[i].children)
                {
                    tmp = handleSelection(els[i].children, sel, true);
                    for(j = 0; j < tmp.length; j++) elArr.push(tmp[j]);
                }
            }
            return ruleHandler(index, elArr, sel, null, els);
        };
        
        handler.e = _getE(index, els);
        handler.selector = _selector(els, sel);
        
        helperObjectDefineReadOnlyPropertys(handler, {
            'set':    function(prop, val, pos){ createRuleIfNotExists(); _set(index, els, prop, val, pos); return handler; },
            'get':    function(prop, retAP){ return _get(index, els, prop, retAP); },
            'update': function(){ _update(index, els); return handler; },
            'delete': function(prop){ _delete(index, els, prop, handler); return handler; },
            'export': function(type){ return _export(index, els, type); },
            'parse':  function(min){ return _export(index, els, !min ? TYPE_EXPORT_css : TYPE_EXPORT_min); },
            'pos':    function(p) { return _pos(index, els, p, sel, parents); },
            'first':  function(){ return _pos(index, els, 0, sel, parents); },
            'last':   function(){ return _pos(index, els, -1, sel, parents); }
        });
        return handler;
    }
    
    function getController()
    {
        var index = [{},!1,0,[],{}],

        cntr = function(sel)
        {
            try
            {
                return handleSelection(index, sel, false, cntr);
            }
            catch (err)
            {
                if(index[4].viewErr) console.log(err);
                MESSAGES.push(err);
            }
        };
        helperObjectDefineReadOnlyPropertys(cntr, {
            version: VERSION,
            //core functions
            'init':   function(toInit){ initElements(index, toInit); return cntr; },
            'import': function(importObj){ handleImport(index, importObj); return cntr; },
            'export': function(type){ return handleSelection(index).export(type); },
            'parse':  function(min){ return handleSelection(index).parse(min); },
            'update': function(sel){ handleSelection(index, sel).update(); return cntr; },
            'new':    function(){ return getController(); },
            //vars handling
            defineVars: function(vars){ index[3] = [vars]; return cntr; },
            addVars:    function(vars){ index[3].push(vars); return cntr; },
            getVars:    function(){ return index[3]; },
            defineConf: function(cnf){ index[4] = helperObjectAssign(index[4], cnf); return cntr; },
            setConf:    function(key, val){ index[4][key] = val; return cntr; },
            getConf:    function(key){ return key ? index[4][key] : index[4]; },
            //helper functions
            parseVars:  function(txt, vars){ return helperParseVars(txt, vars?vars:index[3]); },
            objFromCss: function(css){ return helperObjFromCssText(css); },
            cssFromObj: function(obj, min, tabLen){ return helperCssTextFromObj(obj, min, tabLen); },
            //config & defs
            _conf:      CONF_DEFAULT,
            type:       TYPE,
            exportType: TYPE_EXPORT,
            messages:   MESSAGES
        });
        cntr.defineConf(CONF_DEFAULT);
        
        return cntr;
    }
    return getController();
})();
