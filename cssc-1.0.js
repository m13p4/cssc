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
    
    TYPE_EXPORT_css         = 1,
    TYPE_EXPORT_min         = 2,
    TYPE_EXPORT_obj         = 3, //default
    TYPE_EXPORT_arr         = 4,
    TYPE_EXPORT_notMDObject = 5, //not MultiDimensional Object
    
    CONF_DEFAULT_style_id = "cssc-style",
    CONF_DEFAULT_view_err = true,
    CONF_DEFAULT_parse_tab = 2,
    CONF_DEFAULT_parse_unit_default = "px",
    CONF_DEFAULT_parse_vars_limit = 100,
    
    PRE_IMPORT_TYPE = [TYPE_charset, TYPE_import, TYPE_namespace, TYPE_fontFace],
    PRE_IMPORT_KEYS = ["@charset", "@import", "@namespace", "@font-face"],
    SINGLE_ROW_KEYS = PRE_IMPORT_KEYS.slice(0, 3), //["@charset", "@import", "@namespace"]
    SINGLE_ROW_TYPE = [TYPE_charset, TYPE_import, TYPE_namespace], //["@charset", "@import", "@namespace"]
    
    MESSAGES = [],
    
    _TYPE_Null      = 1,
    _TYPE_Undefined = 2,
    _TYPE_Integer   = 3,
    _TYPE_Float     = 4,
    _TYPE_String    = 5,
    _TYPE_RegExp    = 6,
    _TYPE_Array     = 7,
    _TYPE_Object    = 8,
    _TYPE_Function  = 9,
    _TYPE = {
        'Null'      : _TYPE_Null,
        'Undefined' : _TYPE_Undefined,
        'Integer'   : _TYPE_Integer,
        'Float'     : _TYPE_Float,
        'String'    : _TYPE_String,
        'RegExp'    : _TYPE_RegExp,
        'Array'     : _TYPE_Array,
        'Object'    : _TYPE_Object,
        'Function'  : _TYPE_Function
    },
    
    //check props for IE and older Browsers
    CSS_PROPERTIES_CHECK = {
        float: ["cssFloat"]
    },
    
    _OBJECT_assign = helperElemType(Object.assign) === _TYPE_Function ? 
    Object.assign:function()
    {
        var key, i, args = arguments;
        for(i = 1; i < args.length; i++)
            for(key in args[i]) 
                args[0][key] = args[i][key];
        return args[0];
    },
    _OBJECT_defineProperty = helperElemType(Object.defineProperty) === _TYPE_Function ?
    Object.defineProperty:function(obj, key, params)
    {
        obj[key] = params.value;
    },
    _OBJECT_PREVENTEXTENSIONS = helperElemType(Object.preventExtensions) === _TYPE_Function,
    _OBJECT_freeze = helperElemType(Object.freeze) === _TYPE_Function ? 
    Object.freeze:function(obj)
    {
        var tmp = {};
        helperDefineReadOnlyPropertys(tmp, obj);
        obj = tmp;
        
        if(_OBJECT_PREVENTEXTENSIONS) Object.preventExtensions(obj);
        return obj;
    },
    _OBJECT_keys = helperElemType(Object.keys) === _TYPE_Function ?
    Object.keys:function(obj)
    {
        var ret = [], key;
        for(key in obj) ret.push(key);
        return ret;
    },
    _OBJECT_values = helperElemType(Object.values) === _TYPE_Function ? 
    Object.values:function(obj)
    {
        var ret = [], key;
        for(key in obj) ret.push(obj[key]);
        return ret;
    },
    
    TYPE = _OBJECT_freeze({
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
    TYPE_EXPORT = {
        css:    TYPE_EXPORT_css,
        min:    TYPE_EXPORT_min,
        obj:    TYPE_EXPORT_obj,
        object: TYPE_EXPORT_obj,
        arr:    TYPE_EXPORT_arr,
        array:  TYPE_EXPORT_arr,
        objNMD: TYPE_EXPORT_notMDObject
    },
    TYPE_EXPORT_STR = _OBJECT_freeze({
        css:         "css",
        min:         "min",
        obj:         "obj",
        arr:         "arr",
        object:      "object",
        notMDObject: "objNMD",
        array:       "array"
    }),
    CONF_DEFAULT = _OBJECT_freeze({
        style_id: CONF_DEFAULT_style_id,
        view_err: CONF_DEFAULT_view_err,
        parse_tab: CONF_DEFAULT_parse_tab,
        parse_unit_default: CONF_DEFAULT_parse_unit_default,
        parse_vars_limit: CONF_DEFAULT_parse_vars_limit
    });
    
    function helperError(err, cnf)
    {
        err = '"'+cnf.style_id+'"/'+err.replace(/^.+?:/,function(a)
                                    {return (a+"    ").slice(0,7);});
        if(cnf.view_err) console.log(err);
        MESSAGES.push(err);
    }
    function helperElemType(elem, asStr)
    {
        var type = Object.prototype.toString.call(elem).split(/ |\]/)[1];
        if(type === "Number") type = Math.floor(elem) === elem ? "Integer" : "Float";
        return asStr ? type : (_TYPE[type] || type);
    }
    function helperDefineReadOnlyPropertys(obj, propsObj)
    {
        for(var key in propsObj)
            _OBJECT_defineProperty(obj, key, {
                enumerable: true,
                value: propsObj[key]
            });
    }
    function helperCreateNewStyleElem(index)
    {
        var id = index[4].style_id,
            doc = document;
    
        if(doc.getElementById(id))
        {
            for(var i = 0; i < 10; i++) if(!doc.getElementById(id+'-'+i))
                {
                    id = id+'-'+i;
                    break;
                }
            if(doc.getElementById(id))
                helperError("crElem: can't create element.", index[4]);
        }
        var styleElem = doc.createElement("style");
        styleElem.setAttribute("type", "text/css");
        styleElem.setAttribute("id", id);
        doc.head.appendChild(styleElem);

        index[1] = styleElem;
        index[4].style_id = id;
    }
    function helperParseValue(value, key, defUnit)
    {
        var valType  = helperElemType(value), val,
            isString = valType === _TYPE_String,
            isHex    = isString && value.match(/^0x[0-9a-f\.\+]+$/i);
        
        if(isFinite(value) || isHex)
        {
            defUnit = (defUnit || CONF_DEFAULT_parse_unit_default)+"";
            var vNum = value, frac;
            
            if(isHex)
            {
                var endPos = value.search(/\.|\+/);
                if(endPos < 0) vNum = parseInt(value);
                else
                {
                    frac = value.substr(endPos+1);
                    vNum = parseInt(value.substr(0, endPos)) +
                           (value.charAt(endPos) === "+" ? parseFloat(frac) : 
                           parseInt(frac, 16) / Math.pow(16, frac.length));
                }
                valType = helperElemType(vNum);
            }
            else if(isString)
            {
                vNum    = parseFloat(value);
                valType = helperElemType(vNum);
            }
            
            if(isHex || key.match(/(^|-)color$/i))
            {
                val = vNum; frac = 0;
                if(valType === _TYPE_Float)
                {
                    val = Math.floor(vNum);
                    frac = vNum-val;
                }
                val = [(val&0xff0000)>>16,(val&0xff00)>>8,val&0xff].join(", ");
                value = frac > 0 ? "rgba("+val+", "+(Math.floor(frac*100)/100)+")" : "rgb("+val+")";
            }
            else if(valType === _TYPE_Integer) value = vNum+defUnit;
            else value = (Math.floor(vNum*100)/100)+defUnit;
        }
        else if(isString && value.indexOf(" ") > -1)
        {
            val = value.split(" ");
            for(var i = 0; i < val.length; i++) 
                val[i] = helperParseValue(val[i], key, defUnit);
            value = val.join(" ");
        }
        else if(isString && value.charAt(value.length-1) === "!")
                value = value.substr(0, value.length-1);
        return value;
    }
    function helperCssTextFromObj(obj, min, tabLen, addTab, fromArrayParse)
    {
        var tab = helperElemType(tabLen) === _TYPE_String ? tabLen 
            : (new Array((parseInt(tabLen)||CONF_DEFAULT_parse_tab)+1).join(" ")), 
            cssText = "", key, val, elType = helperElemType(obj), i, tmp;

        addTab = addTab || "";

        if(elType === _TYPE_String) return obj;
        if(elType === _TYPE_Array) for(i = 0; i < obj.length; i++)
                cssText += helperCssTextFromObj(obj[i], min, tab, addTab, true);
        else for(key in obj)
            {
                val = ""+obj[key];
                elType = helperElemType(obj[key]);

                if(elType === _TYPE_Array || elType === _TYPE_Object)
                {
                    if(fromArrayParse && elType === _TYPE_Array)
                    {
                        tmp = helperCssTextFromObj(obj[key], min, tab, addTab+tab, fromArrayParse);
                        
                        if(tmp !== "")
                        {
                            if(min) cssText += key.replace(/\s*(,|:)\s*/g,"$1")+"{"+tmp+"}";
                            else    cssText += addTab+key.replace(/\s*,\s*/g, ",\n"+addTab)+" {\n"+tmp+addTab+"}\n";
                        }
                        continue;
                    }
                        
                    if(elType === _TYPE_Object) val = [obj[key]];

                    for(i = 0; i < val.length; i++)
                    {
                        if(SINGLE_ROW_KEYS.indexOf(key) > -1) // key === "@namespace"||"@import"||"@charset"
                        {
                            cssText += key+" "+val[i]+";"+(min?'':"\n");
                            continue;
                        }

                        tmp = helperCssTextFromObj(val[i], min, tab, addTab+tab, fromArrayParse);

                        if(tmp !== "")
                        {
                            if(min) cssText += key.replace(/\s*(,|:)\s*/g,"$1")+"{"+tmp+"}";
                            else    cssText += addTab+key.replace(/\s*,\s*/g, ",\n"+addTab)+" {\n"+tmp+addTab+"}\n";
                        }
                    }
                }
                else if(SINGLE_ROW_KEYS.indexOf(key) > -1)
                             cssText += key+" "+val+";"+(min?'':"\n");
                else if(min) cssText += key+":"+val.trim().replace(/\s*,\s*/g,",")+";";
                else         cssText += (addTab.length < tab.length ? tab : addTab)+key+": "+val+";\n";
            }
        
        return cssText;
    }
    function helperObjFromCssText(cssText)
    {
        if(/^@(namespace|import|charset)/.test(cssText))
            return cssText.replace(/(^@.*\s*|\s*;\s*$)/g, '');
        var str = cssText.replace(/(^.*?{\s*|\s*}\s*$)/g, ''),
            split = str.split(';'), i, kv, obj = {};
        if(str !== "") for(i = 0; i < split.length; i++)
                if(split[i] !== "")
                {
                    kv = split[i].split(':');
                    obj[kv[0].trim()] = kv.slice(1).join(':').trim();
                }
        return obj;
    }
    function helperFindPropInCssText(cssText, prop)
    {
        var find = cssText.match(new RegExp(prop+"\s*:\s*(.+?);"));
        return find ? find[1].trim() : "";
    }
    function helperCamelCase(str)
    {
        var splSel = str.split("-"), i;
        str = splSel[0];
        for(i = 1; i < splSel.length; i++) str 
            += splSel[i].charAt(0).toUpperCase()+splSel[i].substr(1);
        return str;
    }
    function helperSelectorType(sel)
    {
        var key = sel.trim(), selIO;

        if(key.charAt(0) !== "@") return TYPE_rule;

        key   = key.substr(1);
        selIO = key.indexOf(" ");

        if(selIO > -1) key = key.substr(0, selIO);

        return TYPE[helperCamelCase(key)] || -1;
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
        var parent = cssRule.parentRule ? cssRule.parentRule : cssRule.parentStyleSheet, i;

        for(i = 0; i < parent.cssRules.length; i++) 
            if(parent.cssRules[i] === cssRule)
            {
                parent.deleteRule(i);
                break;
            }
    }
    function helperParseVars(str, vars, limit)
    {
        if(!limit) limit = CONF_DEFAULT_parse_vars_limit;
        if(!vars)  vars = {};
        if(!str)   str = "";

        var varStart = str.lastIndexOf("$"), varEnd, 
            c = 0, v, i, xyz, tmp, key, keySplit, type;

        while(varStart >= 0 && c < limit)
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
                type = helperElemType(v);

                if(i === 0 && keySplit[i] in vars)                                           
                    v = vars[keySplit[i]];
                else if((type === _TYPE_Array || type === _TYPE_Object) && keySplit[i] in v) 
                    v = v[keySplit[i]];
                else if(type === _TYPE_String && keySplit[i].match(/^[0-9]+$/))              
                    v = v.charAt(keySplit[i]);
                else
                {
                    v = "$"+key;
                    break;
                }
                
                if(helperElemType(v) === _TYPE_Function)
                {
                    if(str.charAt(varEnd+1) === "(")
                    { varEnd++;

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
                    { varEnd++;

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
        var toIndex, from, funcName;
        
        toInit = helperElemType(toInit) === _TYPE_Array ? toInit : [toInit];

        for(var i = 0; i < toInit.length; i++)
        {
            toIndex = false;
            from = helperElemType(toInit[i], 1);
            
            if(toInit[i])
            {
                toInit[i] = toInit[i].sheet || toInit[i];

                from = toInit[i].href || from;

                try         { toIndex = toInit[i].cssRules || toIndex; }
                catch(err)  { from+='" -> "'+err; }

                if(!toIndex && helperElemType(toInit[i]) === _TYPE_Function)
                {
                    if(toInit[i].e && helperElemType(toInit[i].e) === _TYPE_Array)
                    {
                        toIndex = toInit[i].e;
                        funcName = "handler";
                    }
                    else if(toInit[i].version === VERSION && toInit[i].type === TYPE)
                    {
                        toIndex = toInit[i]().e;
                        funcName = "ID:"+toInit[i].conf().style_id;
                    }
                    else funcName = toInit[i].name;

                    from = (toIndex ? "CSSC" : from) + "["+funcName+"]";
                }
            }
            
            if(toIndex && toIndex.length > 0) indexCssRules(index, toIndex, null);
            else helperError("init: Can't init from \""+from+'"', index[4]);
        }
    }
    function indexCssRules(index, cssRules, parent)
    {
        for(var i = 0; i < cssRules.length; i++)
            if(cssRules[i] && cssRules[i].parentStyleSheet 
            && cssRules[i].parentStyleSheet.ownerNode 
            && cssRules[i].parentStyleSheet.ownerNode.id !== index[4].style_id)
                addToIndex(index, cssRules[i], parent);
    }
    function addToIndex(index, cssRule, parent, csscSelector)
    {
        var indexKey  = cssRule.cssText.substr(0, cssRule.cssText.indexOf("{")).trim(),
            indexType = cssRule.type, 
            toIndex   = cssRule,
            _index    = parent ? parent.c : index[0],
            indexObjWrapper, indexC = 0,
            useChildren = indexType === TYPE_media || indexType === TYPE_keyframes || indexType === TYPE_supports;

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
            return helperError('index: Unsuported "'+indexKey+'" ['+indexType+']', index[4]);

        if(indexType === TYPE_namespace) indexKey = SINGLE_ROW_KEYS[2];
        if(indexType === TYPE_import)    indexKey = SINGLE_ROW_KEYS[1];
        if(indexType === TYPE_charset)   indexKey = SINGLE_ROW_KEYS[0];

        indexObjWrapper = {
           _s: csscSelector || indexKey, //user-set selector
            s: indexKey,                 //selector
            e: toIndex,                  //element
            t: indexType,                //type
            o: {},                       //object
            n: index[2]++,               //position
            c: useChildren ? {} : false, //children
            p: parent || false,          //parent
            
            uo: false,                   //updatable object
            up: {}                       //updatable properties
        };

        if(_index[indexKey]) indexC = (_index[indexKey].e.push(indexObjWrapper) - 1);
        else                _index[indexKey] = {
                                t: indexType,        //type
                                e: [indexObjWrapper] //content
                            };

        //handle Media & KeyFrames Rules
        if(useChildren) indexCssRules(index, cssRule.cssRules, _index[indexKey].e[indexC]);
        else _index[indexKey].e[indexC].o = helperObjFromCssText(cssRule.cssText);

        return indexObjWrapper;
    }
    function createRule(index, selector, property, value, parent)
    {
        var appendToElem;

        if(!parent && !index[1]) helperCreateNewStyleElem(index);
        
        appendToElem = parent ? parent.e : index[1].sheet;

        var rulePos = appendToElem.cssRules.length, ruleString = "";

        if(property)
        {
            var propType = helperElemType(property), prop;

            if(propType === _TYPE_Object)
            {
                for(var key in property)
                    if(helperElemType(property[key]) === _TYPE_Function)
                    {
                        prop = property[key]();
                        ruleString += key+":"+prop+"; ";
                    }
                    else ruleString += key+":"+property[key]+"; ";
            }
            else if(propType === _TYPE_Function)
            {
                prop = property();
                for(var key in prop)
                    ruleString += key+":"+prop[key]+"; ";
            }
            else ruleString = property+":"+value+";";
        }

        var insRuleString = selector+" { "+ruleString+" }", added = false;

        if(SINGLE_ROW_KEYS.indexOf(selector) > -1) // === "@namespace"||"@import"||"@charset"
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
            helperError("create: "+(parent ? '"' + parent.s + '" > ' : '')
                         + "\"" + selector + "\" -> " + err, index[4]);
        }
        
        return added || addToIndex(index, {
            cssText: insRuleString,
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
            var tmp = (toDel ? index[sel].e.indexOf(toDel) : -1);

            if(!toDel) delete index[sel];
            else if(tmp >= 0)
            {
                index[sel].e.splice(tmp, 1);

                if(index[sel].e.length <= 0) delete index[sel];
            }
        }
    }
    function getHandler(index, sel, getElements)
    {
        var selType = helperElemType(sel),
            _index = helperElemType(index) === _TYPE_Array ? index[0] : index; 

        if(selType === _TYPE_String)
        {
            sel = helperParseVars(sel, index[3], index[4].parse_vars_limit);
            
            if(getElements) return _index[sel] ? _index[sel].e : [];
            
            return ruleHandler(index, (_index[sel] ? _index[sel].e : []), sel);
        }
        else if(selType === _TYPE_RegExp)
        {
            var matches = [], key;

            for(key in _index)
                if(key.match(sel))
                    for(i = 0; i < _index[key].e.length; i++)
                        matches.push(_index[key].e[i]);

            if(getElements) return matches;

            return ruleHandler(index, matches, sel);
        }
        else if(selType === _TYPE_Array)
        {
            var matches = [], i, j, s;

            for(i = 0; i < sel.length; i++)
            {
                s = helperParseVars(sel[i], index[3], index[4].parse_vars_limit);
                if(_index[s]) for(j = 0; j < _index[s].e.length; j++)
                        matches.push(_index[s].e[j]);
            }

            if(getElements) return matches;

            return ruleHandler(index, matches, sel);
        }
        else if(selType === _TYPE_Null || selType === _TYPE_Undefined)
        {
            var matches = [], key;

            for(key in _index)
                for(i = 0; i < _index[key].e.length; i++)
                    matches.push(_index[key].e[i]);

            if(getElements) return matches;

            return ruleHandler(index, matches, sel);
        }
    }
    function handleSelection(index, sel, getElements, _this)
    {
        var selType = helperElemType(sel);

        if([_TYPE_String,_TYPE_RegExp,_TYPE_Array,_TYPE_Null,_TYPE_Undefined].indexOf(selType) > -1) 
            return getHandler(index, sel, getElements);
        else handleImport(index, sel);
        
        return _this;
    }
    function handleImport(index, toImport, parent, isPreImport)
    {
        var importObj, impI, importElem, rule, handlerObj, key, i, tmp, preImport = {};

        if(helperElemType(toImport) !== _TYPE_Array)
            toImport = [toImport];

        if(!isPreImport && !parent)
        {
            tmp = false;
            for(i = 0; i < PRE_IMPORT_KEYS.length; i++) 
                for(impI = 0; impI < toImport.length; impI++)
                    if(PRE_IMPORT_KEYS[i] in toImport[impI])
                    {
                        tmp       = true;
                        importObj = preImport[PRE_IMPORT_KEYS[i]];
                        
                        importElem = toImport[impI][PRE_IMPORT_KEYS[i]];
                        importElem = helperElemType(importElem) === _TYPE_Array ?
                                     importElem : [importElem];
                        
                        importObj = importObj ? importObj.concat(importElem) : importElem;
                    }
            
            if(tmp) handleImport(index, preImport, parent, tmp);
        }
        
        for(impI = 0; impI < toImport.length; impI++)
        {
            importObj = toImport[impI];
            
            for(key in importObj)
            {
                if(key in preImport) continue;

                if(helperElemType(importObj[key]) === _TYPE_Array)
                    importElem = importObj[key];
                else
                    importElem = [importObj[key]];

                key = helperParseVars(key, index[3], index[4].parse_vars_limit);

                for(i = 0; i < importElem.length; i++)
                    if(key.charAt(0) === "@")
                    {
                        if(PRE_IMPORT_KEYS.indexOf(key) > -1) // key === "@font-face"||"@namespace"||"@import"||"@charset"
                            createRule(index, key, importElem[i], null, parent);
                        else if((parent && (parent.t === TYPE_media
                                        || parent.t === TYPE_keyframes
                                        || parent.t === TYPE_supports)
                               ) || /^@(media|keyframes|supports)/.test(key)
                        )
                        {
                            handlerObj = key,
                            tmp = parent;

                            if(parent && !key.match(/^@(media|keyframes|supports)/))
                            {
                                key = helperGenSelector(parent._s, key);
                                tmp = parent.p;
                            }

                            rule = createRule(index, key, null, null, tmp);

                            if(rule && rule.s === rule._s)
                                handleImport(index, importElem[i], rule);
                            else
                            {
                                if(rule)
                                {
                                    helperDeleteCSSRule(rule.e);
                                    delFromIndex(rule.p ? rule.p : index[0], rule.s, rule);
                                }

                                tmp = {
                                    cssText: key + " {}",
                                    placeholder: true,
                                    type: helperSelectorType(key),
                                    cssRules: {}
                                };

                                rule = addToIndex(index, tmp, tmp.p, key);
                                handleImport(index, importElem[i], rule);
                            }

                            if(parent)
                            {
                                if(!parent.o[handlerObj]) parent.o[handlerObj] = [];
                                parent.o[handlerObj].push(rule);
                            }
                        }
                        else helperError('import: Unsuported "'+key+'" ['+helperSelectorType(key)+']', index[4]);
                    }
                    else if([_TYPE_String,_TYPE_Float,_TYPE_Integer].indexOf(helperElemType(importElem[i])) > -1)
                    { 
                        tmp = parent ? parent.c : index[0];
                        if(!tmp["*"]) createRule(index, "*", null, null, parent);
                        _set(index, [tmp["*"].e[0]], key, importElem[i]);
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
        if(helperElemType(pos) === _TYPE_Integer) // single Set
        {
            if(PRE_IMPORT_TYPE.indexOf(e[pos].t) > -1)
                return helperError('set: Readonly rule "'+e[pos].s
                                  +'" ['+e[pos].t+']', index[4]);

            prop = helperParseVars(prop, index[3], index[4].parse_vars_limit);

            if(e[pos].c)
                _set(index, getHandler(e[pos].c, null, true), prop, val);
            else 
            {
                var prsVal, valType = helperElemType(val), tmp, camelProp;

                if(valType === _TYPE_Object || valType === _TYPE_Array)
                {
                    var isAtRule = prop.charAt(0) === "@", pObj, rule,
                        valArr = valType === _TYPE_Object ? [val] : val, i,
                        newSel = helperGenSelector(e[pos].s, prop);

                    if(isAtRule) newSel = e[pos].p ? helperGenSelector(e[pos].p.s, prop) : prop;

                    for(i = 0; i < valArr.length; i++)
                    {
                        rule = createRule(index, newSel, null, null, isAtRule ? false : e[pos].p);

                        if(rule)
                        {
                            if(isAtRule) 
                            {
                                tmp = rule;
                                rule = createRule(index, e[pos].s, null, null, rule);
                                
                                if(!rule) rule = tmp;
                            }

                            _set(index, [rule], valArr[i]);

                            if(isAtRule && e[pos].p)
                            {
                                pObj = e[pos].p;

                                if(helperElemType(pObj.o[prop]) !== _TYPE_Array)
                                    pObj.o[prop] = [];
                                pObj.o[prop].push(rule.p);
                            }

                            if(helperElemType(e[pos].o[prop]) !== _TYPE_Array)
                                e[pos].o[prop] = [];
                            e[pos].o[prop].push(rule);
                        }
                    }
                }
                else if(valType === _TYPE_Function)
                {
                    try
                    {
                        var valToSet = val(prop, _get(index, [e[pos]], prop));

                        _set(index, e, prop, valToSet, pos);
                        e[pos].up[prop] = val;
                    }
                    catch(err) { helperError("set: "+err, index[4]); }
                }
                else
                {
                    prsVal = helperParseValue(val, prop, index[4].parse_unit_default);

                    if(prop in CSS_PROPERTIES_CHECK)
                    {
                        for(tmp = 0; tmp < CSS_PROPERTIES_CHECK[prop].length; tmp++)
                            if(CSS_PROPERTIES_CHECK[prop][tmp] in e[pos].e.style)
                            {
                                camelProp = CSS_PROPERTIES_CHECK[prop][tmp];
                                break;
                            }
                    }
                    else camelProp = helperCamelCase(prop);
                        
                    if(camelProp !== prop) e[pos].e.style[camelProp] = prsVal;
                    
                    e[pos].e.style[prop] = prsVal;
                    e[pos].o[prop] = prsVal;
                }
            }
        }
        else // multi Set
        {
            var i, key, props, propType = helperElemType(prop);
        
            if(propType === _TYPE_Array) for(i = 0; i < prop.length; i++)
                {
                    if(e.length > i) _set(index, [e[i]], prop[i]);
                    else             break;
                }
            else for(i = 0; i < e.length; i++)
                {
                    if(propType === _TYPE_Object) 
                        for(key in prop) _set(index, e, key, prop[key], i);
                    else if(propType === _TYPE_Function)
                    {
                        props = prop(e[i].s, _get(index,[e[i]])[e[i].s]);
                        
                        for(key in props)
                            _set(index, e, key, props[key], i);
                        //add to updatable
                        e[i].uo = prop;
                    }
                    else _set(index, e, prop, val, i);
                }
        }
    }
    function _get(index, e, prop, returnAllProps)
    {
        if(!prop) return _export(index, e, TYPE_EXPORT_obj);

        var toRet = returnAllProps ? [] : "", tmp, i;

        for(i = 0; i < e.length; i++)
        {
            tmp = "";

            if(e[i].o[prop]) 
            {
                tmp = e[i].o[prop];

                if(helperElemType(tmp) === _TYPE_Array)
                    tmp = _export(index, tmp, TYPE_EXPORT_obj);
            }

            if(!tmp || tmp === "")
                tmp = e[i].e.style[prop];
            if(!tmp || tmp === "")
                tmp = helperFindPropInCssText(e[i].e.cssText, prop);

            if(tmp && returnAllProps) toRet.push(tmp);
            else toRet = tmp;
        }
        return toRet;
    }
    function _export(index, e, type, ignore)
    {
        if(helperElemType(type) !== _TYPE_Integer)
            type = TYPE_EXPORT[type] || TYPE_EXPORT_obj;
        
        var exportObj = {}, obj, i, j, key, tmp, _type = type;

        if(type === TYPE_EXPORT_css || type === TYPE_EXPORT_min)
            type = TYPE_EXPORT_arr;

        if(!ignore) ignore = [];

        for(i = 0; i < e.length; i++)
        {
            if(ignore.indexOf(e[i]) < 0)
            {
                if(SINGLE_ROW_TYPE.indexOf(e[i].t) > -1)
                    obj = e[i].o;
                else
                {
                    obj = _OBJECT_assign({}, e[i].o);

                    for(key in e[i].o)
                    {
                        if(helperElemType(e[i].o[key]) === _TYPE_Array)
                        {
                            if(type === TYPE_EXPORT_notMDObject || type === TYPE_EXPORT_arr)
                            {
                                obj[key] = null;
                                delete obj[key];
                                continue;
                            }

                            obj[key] = [];

                            for(j = 0; j < e[i].o[key].length; j++)
                                if(ignore.indexOf(e[i].o[key][j]) < 0)
                                {
                                    ignore.push(e[i].o[key][j]);

                                    tmp = _export(index, [e[i].o[key][j]], type, ignore)[e[i].o[key][j].s];
                                    if(tmp && _OBJECT_keys(tmp).length > 0)
                                        obj[key][j] = tmp;
                                }

                            if(obj[key].length === 0) delete obj[key];
                            else if(obj[key].length === 1) obj[key] = obj[key][0];
                        }
                        else if(_type !== TYPE_EXPORT_css && _type !== TYPE_EXPORT_min && isFinite(e[i].o[key]))
                            obj[key] = obj[key]+"!";
                    }
                }

                if(e[i].c)
                    obj = _OBJECT_assign(_export(index, getHandler(e[i].c, null, true), type, ignore), obj);

                if(_OBJECT_keys(obj).length < 1) continue;

                if(type === TYPE_EXPORT_arr)
                {
                    exportObj[e[i].n] = {};
                    exportObj[e[i].n][e[i].s] = obj;
                }
                else if(exportObj[e[i].s])
                {
                    if(helperElemType(exportObj[e[i].s]) !== _TYPE_Array)
                        exportObj[e[i].s] = [exportObj[e[i].s]];

                    exportObj[e[i].s].push(obj);
                }
                else exportObj[e[i].s] = obj;

                ignore.push(e[i]);
            }
        }

        if(type === TYPE_EXPORT_arr) 
        {   
            exportObj = _OBJECT_values(exportObj);
            return type === _type ? exportObj : helperCssTextFromObj(exportObj, _type===TYPE_EXPORT_min, index[4].parse_tab);
        }

        var sortExpObj = {}; tmp = false;
        for(i = 0; i < PRE_IMPORT_KEYS.length; i++) 
            if(exportObj[PRE_IMPORT_KEYS[i]])
            {
                sortExpObj[PRE_IMPORT_KEYS[i]] = exportObj[PRE_IMPORT_KEYS[i]];
                tmp = true;
            }
        
        if(tmp) for(i in exportObj) if(!sortExpObj[i]) sortExpObj[i] = exportObj[i];
        
        return tmp ? sortExpObj : exportObj;
    }
    function _update(index, e)
    {
        var i, tmp, key;

        for(i = 0; i < e.length; i++)
        {
            if(e[i].uo !== false)
            {
                tmp = e[i].uo(e[i].s,_get(index,[e[i]])[e[i].s]); //object update
                for(key in tmp) _set(index, e, key, tmp[key], i);
            }

            if(e[i].c) _update(index, getHandler(e[i].c, null, true));
            else for(key in e[i].up)
                    _set(index, e, key, e[i].up[key](key,_get(index,[e[i]],key)), i);
        }
    }
    function _delete(index, e, prop, _this)
    {
        var isUndef = [_TYPE_Null,_TYPE_Undefined].indexOf(helperElemType(prop)) > -1, i, _e = [];

        for(i = 0; i < e.length; i++)
        {
            if(e[i].c) _delete(index, getHandler(e[i].c, null, true), prop, _this);
            
            if(isUndef)
            {
                helperDeleteCSSRule(e[i].e);
                delFromIndex(e[i].p ? e[i].p : index[0], e[i].s, e[i]);
            }
            else
            {
                _e.push(e[i]);
                e[i].e.style[prop] = "";
                
                if(e[i].o[prop])
                {
                    if(helperElemType(e[i].o[prop]) === _TYPE_Array)
                        _delete(index, e[i].o[prop]);
                    delete e[i].o[prop];
                }
            }
        }
        if(_this) _this.e = _getE(index, _e);
    }
    function _pos(index, e, p, sel, parents)
    {
        if(p < 0) p += e.length;
        if(e[p]) return ruleHandler(index, [e[p]], sel, false, e[p].p || false);
        return ruleHandler(index, [], sel, false, parents);
    }
    function _getE(index, e)
    {
        var _e = [];
        for(var i = 0; i < e.length; i++) if(e[i].e)
                _e.push(e[i].e.placeholder ? _export(index, [e[i]], TYPE_EXPORT_obj) : e[i].e);
        return _e;
    }
    function _selector(e, sel)
    {
        return e.length === 1 ? e[0].s : sel;
    }
    function __confVars(cnfVars, setCnfVars, val, defRet)
    {
        var cnfType = helperElemType(setCnfVars);
        
        if(cnfType === _TYPE_Object) cnfVars = _OBJECT_assign(cnfVars, setCnfVars);
        else if(cnfType === _TYPE_String) 
        {
            if(helperElemType(val) === _TYPE_Undefined) return cnfVars[setCnfVars];
            else                                        cnfVars[setCnfVars] = val;
        }
        else if(cnfType === _TYPE_Array)
        {
            var ret = {}, i;
            for(i = 0; i < setCnfVars.length; i++)
                ret[setCnfVars[i]] = cnfVars[setCnfVars[i]];
            return ret;
        }
        else if(cnfType === _TYPE_Undefined) return cnfVars;
        return defRet;
    }
    function ruleHandler(index, elems, sel, fromHas, parents)
    {
        var handler;
        
        function createRuleIfNotExists()
        {
            if(elems.length < 1 && !fromHas && helperElemType(sel) === _TYPE_String)
            {
                var rule, contentElems = [], i, _p = parents ? parents : [null];

                for(i = 0; i < _p.length; i++)
                {
                    rule = createRule(index, sel, null, null, _p[i]);
                    if(rule) contentElems.push(rule);
                }

                elems = contentElems;
                handler.e = _getE(index, elems);
                handler.selector = _selector(elems, sel);
            }
        }
        handler = function(sel)
        {
            var i, j, elArr = [], tmp;
            createRuleIfNotExists();

            for(i = 0; i < elems.length; i++)
                if(elems[i].c)
                {
                    tmp = handleSelection(elems[i].c, sel, true);
                    for(j = 0; j < tmp.length; j++) elArr.push(tmp[j]);
                }
            return ruleHandler(index, elArr, sel, null, elems);
        };
        handler.e = _getE(index, elems);
        handler.selector = _selector(elems, sel);
        
        helperDefineReadOnlyPropertys(handler, {
            'set':    function(prop, val)   { createRuleIfNotExists(); _set(index, elems, prop, val); return handler; },
            'get':    function(prop, retAP) { return _get(index, elems, prop, retAP); },
            'update': function()            { _update(index, elems); return handler; },
            'delete': function(prop)        { _delete(index, elems, prop, handler); return handler; },
            'export': function(type)        { return _export(index, elems, type); },
            'parse':  function(min)         { return _export(index, elems, !min ? TYPE_EXPORT_css : TYPE_EXPORT_min); },
            'pos':    function(p)           { return _pos(index, elems, p, sel, parents); },
            'first':  function()            { return _pos(index, elems, 0, sel, parents); },
            'last':   function()            { return _pos(index, elems, -1, sel, parents); }
        });
        return handler;
    }
    function getController()
    {
        var index = [{},!1,0,{},{}],

        controller = function(sel)
        {
            try         { return handleSelection(index, sel, false, controller); }
            catch (err) { helperError("CSSC: "+err, index[4]); }
        };
        helperDefineReadOnlyPropertys(controller, {
            version: VERSION,
            //core functions
            'init':   function(toInit)    { initElements(index, toInit); return controller; },
            'import': function(importObj) { handleImport(index, importObj); return controller; },
            'export': function(type)      { return handleSelection(index).export(type); },
            'parse':  function(min)       { return handleSelection(index).parse(min); },
            'update': function(sel)       { handleSelection(index, sel).update(); return controller; },
            'new':    function()          { return getController(); },
            //conf & vars
            conf:       function(cnf, val)  { return __confVars(index[4], cnf, val, controller, false); },
            vars:       function(vars, val) { return __confVars(index[3], vars, val, controller, false); },
            //helper functions
            parseVars:  function(txt, vars)        { return helperParseVars(txt, vars?_OBJECT_assign({}, index[3], vars):index[3], index[4].parse_vars_limit); },
            objFromCss: function(css)              { return helperObjFromCssText(css); },
            cssFromObj: function(obj, min, tabLen) { return helperCssTextFromObj(obj, min, tabLen); },
            //config & defs
            _conf:       CONF_DEFAULT,
            type:        TYPE,
            type_export: TYPE_EXPORT_STR,
            messages:    MESSAGES
        });
        controller.conf(CONF_DEFAULT);
        
        return controller;
    }
    return getController();
})();
