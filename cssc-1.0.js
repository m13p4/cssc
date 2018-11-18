/**
 * CSSController - Dynamic CSS Controller. 
 *  ↳ CSSC         A way to manage style sheets.
 * 
 * @version 1.0b
 *
 * @author m13p4
 * @copyright Meliantchenkov Pavel
 */
var CSSC = (function(CONTEXT)
{ 'use strict';
    
    var VERSION = "1.0.0",
    
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
    
    PRE_IMPORT_KEYS = ["@charset", "@import", "@namespace", "@font-face"],
    SINGLE_ROW_KEYS = PRE_IMPORT_KEYS.slice(0, 3), //["@charset", "@import", "@namespace"]
    
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
    
    //[{},!1,[],{},{},{},[]],
    INDEX_OBJECT = 0,
    INDEX_SHEET  = 1,
    INDEX_ARRAY  = 2,
    INDEX_VARS   = 3,
    INDEX_CONF   = 4,
    INDEX_ALIAS  = 5,
    INDEX_GLOBAL = 6,
    INDEX_UNITS  = 7,
    
    INDEX_CHILD_SEPARATOR = " >> ",
    
    //check if node Context
    _ON_SERVER = helperElemType(CONTEXT) === _TYPE_Object,
    
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
    
    function _IF_OR()
    {
        var args = arguments, i = 1;
        for(; i < args.length; i++) if(args[0] === args[i]) 
            return true;
        return false;
    }
    function helperError(err, index)
    {
        var cnf = index[INDEX_CONF];
        err = '"'+cnf.style_id+'"/'+err.replace(/^.+?:/,function(a)
                                    {return (a+"     ").slice(0,8);});
        if(cnf.view_err) console.log(err);
        MESSAGES.push(err);
    }
    function helperElemType(elem, asStr)
    {
        var type = Object.prototype.toString.call(elem).split(/ |\]/)[1];
        if(type === "Number" && !asStr) type = Math.floor(elem) === elem ? _TYPE_Integer : _TYPE_Float;
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
        if(_ON_SERVER) index[INDEX_SHEET] = true;
        else
        {
            var id = index[INDEX_CONF].style_id;

            if(CONTEXT.getElementById(id))
                for(var i = 0; i < 10; i++) if(!CONTEXT.getElementById(id+'-'+i))
                    {
                        id = id+'-'+i;
                        break;
                    }
                    
            if(CONTEXT.getElementById(id))
                return helperError("create:can't create element.", index);
            
            var styleElem = CONTEXT.createElement("style");
            styleElem.setAttribute("type", "text/css");
            styleElem.setAttribute("id", id);
            CONTEXT.head.appendChild(styleElem);

            index[INDEX_SHEET] = styleElem;
            index[INDEX_CONF].style_id = id;
        }
    }
    function helperParseValue(value, key, index)
    {
        var valType  = helperElemType(value), val,
            isString = valType === _TYPE_String,
            isHex    = isString && value.match(/^0x[0-9a-f\.\+]+$/i);
        
        if(isHex || isFinite(value))
        {
            var unit = index[INDEX_UNITS][key],
                vNum = value, frac;
            
            if(helperElemType(unit) === _TYPE_Undefined)
                unit = index[INDEX_CONF].parse_unit_default || CONF_DEFAULT_parse_unit_default;
            unit += "";
            
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
            
            if(isHex || /(^|-)color$/i.test(key))
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
            else if(valType === _TYPE_Integer) value = vNum+unit;
            else value = (Math.floor(vNum*100)/100)+unit;
        }
        else if(isString && value.indexOf(" ") > -1)
        {
            val = value.split(" ");
            for(var i = 0; i < val.length; i++) 
                val[i] = helperParseValue(val[i], key, index);
            value = val.join(" ");
        }
        else if(isString && value.charAt(value.length-1) === "!")
            value = value.substr(0, value.length-1);
        
        return value;
    }
    function helperObjFromCssText(cssText)
    {
        if(/^@(namespace|import|charset)/.test(cssText))
            return cssText.replace(/(^@.*\s+|\s*;\s*$)/g, '');
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
    function helperCamelCase(str)
    {
        var splSel = str.split("-"), i;
        str = splSel[0];
        for(i = 1; i < splSel.length; i++) str += 
                splSel[i].charAt(0).toUpperCase()+splSel[i].substr(1);
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
        else                           sel = " " + sel.trim();

        if(pSel.indexOf(",") >= 0 || sel.indexOf(",") > 0)
        {
            var pSelSplit = pSel.split(","), i, newSel = "",
                selSplit = sel.split(","), j;

            if(sel.charAt(0) !== ",")
                for(i = 0; i < pSelSplit.length; i++)
                    for(j = 0; j < selSplit.length; j++)
                        newSel += pSelSplit[i] + selSplit[j] + ", ";
            else //for(i = 0; i < pSelSplit.length; i++)
                    newSel += pSel + sel + ", ";

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
    function helperParseVars(str, index)
    {
        if(!str)   str = "";

        var varStart = str.lastIndexOf("$"), varEnd, 
            c = 0, v, i, xyz, tmp, key, keySplit, type,
            limit = index[INDEX_CONF].parse_vars_limit || CONF_DEFAULT_parse_vars_limit,
            vars  = index[INDEX_VARS] || {};

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
                else if(_IF_OR(type, _TYPE_Array, _TYPE_Object) && keySplit[i] in v) 
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
            else helperError("init:Can't init from \""+from+'"', index);
        }
    }
    function indexCssRules(index, cssRules, parent)
    {
        for(var i = 0; i < cssRules.length; i++)
            if(!_ON_SERVER 
            && cssRules[i] && cssRules[i].parentStyleSheet 
            && cssRules[i].parentStyleSheet.ownerNode 
            && cssRules[i].parentStyleSheet.ownerNode.id !== index[INDEX_CONF].style_id)
                addToIndex(index, cssRules[i], parent);
    }
    function addToIndex(index, cssRule, parent, csscSelector, fromCreate)
    {
        var indexKey  = cssRule.cssText.substr(0, cssRule.cssText.indexOf("{")).trim(),
            indexType = cssRule.type, 
            toIndex   = cssRule,
            _index    = parent ? parent.c : index[INDEX_OBJECT],
            indexObjWrapper, indexC,
            useChildren = _IF_OR(indexType, TYPE_media, TYPE_keyframes, TYPE_supports);

        //@todo: support all types
        if(!_IF_OR(indexType, TYPE_rule,
                              TYPE_fontFace,
                              TYPE_media,
                              TYPE_keyframes,
                              TYPE_keyframe,
                              TYPE_page,
                              TYPE_supports,
                              TYPE_namespace,
                              TYPE_import,
                              TYPE_charset)
        ) return helperError('index:Unsuported "'+indexKey+'" ['+indexType+']', index);

        if(_IF_OR(indexType, TYPE_namespace, TYPE_import, TYPE_charset))
        {
            if(indexType === TYPE_namespace)    indexKey = SINGLE_ROW_KEYS[2];
            else if(indexType === TYPE_import)  indexKey = SINGLE_ROW_KEYS[1];
            else                                indexKey = SINGLE_ROW_KEYS[0];
            csscSelector = indexKey;
        }

        indexObjWrapper = {
            n: 0,                        //position
           _s: csscSelector || indexKey, //user-set selector
            s: indexKey,                 //selector
            e: toIndex,                  //element
            t: indexType,                //type
            p: parent || false,          //parent
            o: {},                       //object
            c: useChildren ? {} : false, //children
//            oc: {},                      //object children
//            io: false,                   //in Object           
            
            uo: false,                   //updatable object
            up: {}                       //updatable properties
        };
        
        //handle Media & KeyFrames Rules
        if(useChildren && !fromCreate) indexCssRules(index, cssRule.cssRules, indexObjWrapper);
        else if(!useChildren) indexObjWrapper.o = helperObjFromCssText(cssRule.cssText);
        
        indexC = index[INDEX_ARRAY].push(indexObjWrapper)-1;
        indexObjWrapper.n = indexC;
        if(!parent) index[INDEX_GLOBAL][indexC] = indexObjWrapper;
        
        var toSet = [[indexKey,_index]], i = 0, altIndex = csscSelector !== indexKey;
        
        if(altIndex) 
            toSet.push([csscSelector,_index]);
        if(parent) 
            toSet.push([parent.s+INDEX_CHILD_SEPARATOR+indexKey,index[INDEX_OBJECT]]);
        if(parent && parent.s !== parent._s && altIndex) 
            toSet.push([parent._s+INDEX_CHILD_SEPARATOR+csscSelector,index[INDEX_OBJECT]]);
        if(parent && parent.s !== parent._s)
            toSet.push([parent._s+INDEX_CHILD_SEPARATOR+indexKey,index[INDEX_OBJECT]]);
        
        for(; i < toSet.length; i++)
        {
            if(toSet[i][1][toSet[i][0]]) toSet[i][1][toSet[i][0]].e.push(indexC);
            else                         toSet[i][1][toSet[i][0]] = {
                                            t: indexType, //type
                                            e: [indexC]   //elements
                                        };
        }
        
        return indexObjWrapper;
    }
    function createRule(index, selector, property, value, parent)
    {
        var appendToElem, ruleString = "", added = false;

        if(!parent && !index[INDEX_SHEET]) helperCreateNewStyleElem(index);
        
        appendToElem = parent ? parent.e : index[INDEX_SHEET].sheet;

        if(property)
        {
            var propType = helperElemType(property), prop;

            if(propType === _TYPE_Object)
            {
                for(var key in property)
                    if(helperElemType(property[key]) === _TYPE_Function)
                    {
                        prop = property[key]();
                        ruleString += key+":"+helperParseValue(prop, key, index)+"; ";
                    }
                    else ruleString += key+":"+helperParseValue(property[key], key, index)+"; ";
            }
            else if(propType === _TYPE_Function)
            {
                prop = property();
                for(var key in prop)
                    ruleString += key+":"+helperParseValue(prop[key], key, index)+"; ";
            }
            else ruleString = property+":"+helperParseValue(value, key, index)+";";
        }
        
        var insRuleString = selector+" { "+ruleString+" }";

        if(SINGLE_ROW_KEYS.indexOf(selector) > -1) // === "@namespace"||"@import"||"@charset"
            insRuleString = selector+" "+property;
        
        if(!_ON_SERVER)
        {
            try
            {
                var rulePos = appendToElem.insertRule(insRuleString, appendToElem.cssRules.length);
                
                if(rulePos > -1) 
                    added = addToIndex(index, appendToElem.cssRules[rulePos], parent, selector, true);
                
            }
            catch(err)
            {
                helperError("create:\""+(parent ?  parent.s + ' >> ' : '')
                             + selector + "\" -> " + err, index);
            }
        }
        
        return added || addToIndex(index, {
            cssText: insRuleString,
            type: helperSelectorType(selector),
            placeholder: !_ON_SERVER,
            cssRules: {},
            style: {}
        }, parent, selector, true);
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
    function fromIndexKey(index, keyArr)
    {
        if(helperElemType(keyArr) !== _TYPE_Array) keyArr = [keyArr];
        var indexArr = index[INDEX_ARRAY], elems = [], i = 0;
        for(; i < keyArr.length; i++)
            if(indexArr[keyArr[i]]) elems[keyArr[i]] = indexArr[keyArr[i]];
        return elems;
    }
    function getHandler(index, parent, sel, getElements)
    {
        var selType = helperElemType(sel),
            isMainIndex = !parent,
            _index = isMainIndex ? index[INDEX_OBJECT] : parent.c,
            matches = []; 

        if(selType === _TYPE_String)
        {
            sel = helperParseVars(sel, index);
            if(_index[sel]) matches = _index[sel].e;
        }
        else if(selType === _TYPE_RegExp)
        {
            var key;

            for(key in _index)
                if(sel.test(key))
                    for(i = 0; i < _index[key].e.length; i++)
                        matches.push(_index[key].e[i]);
        }
        else if(selType === _TYPE_Array)
        {
            var i, j, s;

            for(i = 0; i < sel.length; i++)
            {
                s = helperParseVars(sel[i], index);
                if(_index[s]) for(j = 0; j < _index[s].e.length; j++)
                        matches.push(_index[s].e[j]);
            }
        }
        else if(_IF_OR(selType, _TYPE_Null, _TYPE_Undefined))
        {
            var key;

            if(isMainIndex) return getElements ? 
                            index[INDEX_GLOBAL] : 
                            ruleHandler(index, index[INDEX_GLOBAL]);
            else for(key in _index)
                for(i = 0; i < _index[key].e.length; i++)
                    matches.push(_index[key].e[i]);
        }
        
        matches = fromIndexKey(index, matches);
        
        return getElements ? matches : ruleHandler(index, matches, sel);
    }
    function handleSelection(index, sel, getElements, _this)
    {
        var selType = helperElemType(sel);

        if(_IF_OR(selType, _TYPE_String, 
                           _TYPE_RegExp, 
                           _TYPE_Array, 
                           _TYPE_Null, 
                           _TYPE_Undefined)
        ) return getHandler(index, false, sel, getElements);
        
        handleImport(index, sel, false);
        return _this;
    }
    function handleImport(index, toImport, parent, isPreImport)
    {
        var importObj, impI, importElem, rule, handlerObj, key, i, tmp, preImport = {},
            medKefrSup = /^@(media|keyframes|supports)/;

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
                        
                        preImport[PRE_IMPORT_KEYS[i]] = importObj ? importObj.concat(importElem) : importElem;
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

                key = helperParseVars(key, index);

                for(i = 0; i < importElem.length; i++)
                    if(key.charAt(0) === "@")
                    {
                        if(PRE_IMPORT_KEYS.indexOf(key) > -1) // key === "@font-face"||"@namespace"||"@import"||"@charset"
                            createRule(index, key, importElem[i], null, parent);
                        else if((parent && _IF_OR(parent.t, TYPE_media, TYPE_keyframes, TYPE_supports)) 
                                || medKefrSup.test(key))
                        {
                            handlerObj = key,
                            tmp = parent;

                            if(parent && !key.match(medKefrSup))
                            {
                                key = helperGenSelector(parent._s, key);
                                tmp = parent.p;
                            }

                            rule = createRule(index, key, null, null, tmp);
                            handleImport(index, importElem[i], rule, false, true);
                            
                            if(parent)
                            {
//                                rule.io = true;
                                if(!parent.o[handlerObj]) parent.o[handlerObj] = [];
                                parent.o[handlerObj].push(rule.n);
                            }
                        }
                        else helperError('import:Unsuported "'+key+'" ['+helperSelectorType(key)+']', index);
                    }
                    else if(_IF_OR(helperElemType(importElem[i]), _TYPE_String,_TYPE_Float,_TYPE_Integer))
                    { 
                        tmp = parent ? parent.c : index[INDEX_OBJECT];
                        if(!tmp["*"]) createRule(index, "*", null, null, parent);
                        _set(index, fromIndexKey(index, tmp["*"].e), key, importElem[i]);
                    }
                    else
                    {
                        rule = createRule(index, key, null, null, parent);
                        if(rule) _set(index, [rule], importElem[i]);
                    }
                
            }
        }
    }
    function _set(index, e, prop, val, pos, fromUpdate)
    {
        if(e[pos]) // helperElemType(pos) === _TYPE_Integer) // single Set
        {
            if(_IF_OR(e[pos].t, TYPE_charset, TYPE_import, TYPE_namespace, TYPE_fontFace))
                return helperError('set:Readonly rule "'+e[pos].s
                                  +'" ['+e[pos].t+']', index);

            prop = helperParseVars(prop, index);

            if(e[pos].c)
                _set(index, getHandler(index, e[pos], null, true), prop, val, false, fromUpdate);
            else 
            {
                var prsVal, valType = helperElemType(val), tmp, camelProp;
                
                //controll properties
                if(prop.charAt(0) === "!")
                {
                    prop = prop.substr(1).toLowerCase();
                    
                    switch(prop)
                    {
                        case "extend": _set(index, [e[pos]], val); break;
                        case "ignore": /* @todo: implement */ break;
                    }
                }
                else if(_IF_OR(valType, _TYPE_Object, _TYPE_Array))
                {
                    var isAtRule = prop.charAt(0) === "@", pObj, rule,
                        valArr = valType === _TYPE_Object ? [val] : val, i,
                        newSel = helperGenSelector(e[pos].s, prop);

                    if(!fromUpdate && isAtRule) newSel = e[pos].p ? helperGenSelector(e[pos].p.s, prop) : prop;

                    for(i = 0; i < valArr.length; i++)
                    {
                        if(fromUpdate && helperElemType(e[pos].o[prop]) === _TYPE_Array) 
                            _set(index, fromIndexKey(index, e[pos].o[prop]), valArr[i], false, false, fromUpdate);
                        else
                        {
                            rule = createRule(index, newSel, null, null, isAtRule ? false : e[pos].p);

                            if(!fromUpdate && rule)
                            {
                                if(isAtRule) 
                                {
                                    tmp = rule;
                                    rule = createRule(index, e[pos].s, null, null, rule);

                                    if(!rule) rule = tmp;
                                }
                                
                                _set(index, [rule], valArr[i], false, false, fromUpdate);

                                if(isAtRule && e[pos].p)
                                {
                                    pObj = e[pos].p;

                                    if(helperElemType(pObj.o[prop]) !== _TYPE_Array)
                                        pObj.o[prop] = [];
                                    pObj.o[prop].push(rule.p.n);
                                }

//                                rule.io = true;
                                if(helperElemType(e[pos].o[prop]) !== _TYPE_Array)
                                    e[pos].o[prop] = [];
                                e[pos].o[prop].push(rule.n);
                            }
                        }
                    }
                }
                else if(valType === _TYPE_Function)
                {
                    try
                    {
                        var valToSet = val(prop, _get(index, [e[pos]], prop));

                        _set(index, e, prop, valToSet, pos, fromUpdate);
                        if(!fromUpdate) e[pos].up[prop] = val;
                    }
                    catch(err) { helperError("set:"+err, index); }
                }
                else
                {
                    prsVal = helperParseValue(val, prop, index);

                    if(prop in index[INDEX_ALIAS]) for(tmp = 0; tmp < index[INDEX_ALIAS][prop].length; tmp++)
                            _set(index, e, index[INDEX_ALIAS][prop][tmp], val, pos, fromUpdate);

                    if(!_ON_SERVER)
                    {
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
                    }
                    e[pos].o[prop] = prsVal;
                }
            }
        }
        else // multi Set
        {
            var i = 0, key, props, propType = helperElemType(prop);
            
            for(; i < e.length; i++) if(e[i])
            {
                //i = parseInt(i);
                if(propType === _TYPE_Object) for(key in prop) 
                        _set(index, e, key, prop[key], i, fromUpdate);
                else if(propType === _TYPE_Function)
                {
                    props = prop(e[i].s, _get(index,[e[i]])[e[i].s]);

                    for(key in props)
                        _set(index, e, key, props[key], i, fromUpdate);
                    //add to updatable
                    if(!fromUpdate) e[i].uo = prop;
                }
                else _set(index, e, prop, val, i, fromUpdate);
            }
        }
    }
    function _get(index, e, prop, returnAllProps)
    {
        if(!prop) return _export(index, e, TYPE_EXPORT_obj);

        var toRet = returnAllProps ? [] : "", tmp, i = 0;

        for(; i < e.length; i++) if(e[i])
        {
            tmp = "";

            if(e[i].o[prop]) 
            {
                tmp = e[i].o[prop];

                if(helperElemType(tmp) === _TYPE_Array)
                    tmp = _export(index, fromIndexKey(index,tmp), TYPE_EXPORT_obj);
            }

            if(!_ON_SERVER)
            {
                if(!tmp) tmp = e[i].e.style[prop];
                if(!tmp)
                {
                    tmp = e[i].e.cssText.match(new RegExp(prop+"\s*:\s*(.+?);"));
                    tmp = tmp ? tmp[1].trim() : "";
                }
            }
            
            if(tmp) 
            {
                if(returnAllProps) toRet.push(tmp);
                else toRet = tmp;
            }
        }
        return toRet;
    }
    function _parse(index, e, isMin, ignore, tabAdd, tab)
    {
        if(!ignore) ignore = [];
        var rowSep = ":", rowEnd = ";", ruleBeginn = "{", ruleEnd = "}";
        if(isMin)
        {
            tab = "";
            tabAdd = "";
        }
        else
        {
            if(!tab)
            {
                tab = index[INDEX_CONF].parse_tab;
                var tabType = helperElemType(tab);
                if(!_IF_OR(tabType, _TYPE_String, _TYPE_Integer, _TYPE_Float))
                {
                    tab = CONF_DEFAULT_parse_tab;
                    tabType = helperElemType(tab);
                }

                if(tabType === _TYPE_Float)  tab = Math.floor(tab);
                if(tabType !== _TYPE_String) tab = new Array(tab+1).join(" ");
            }
            tabAdd     = tabAdd||"";
            ruleBeginn = " {\n"; 
            rowSep    += " ";
            rowEnd    += "\n"; 
            ruleEnd   += "\n";
        }
        
        var i=0, rules = "", cs = "", imp = "", ns = "", ff = "", key, tmp;
        for(; i < e.length; i++) if(e[i] && ignore.indexOf(i) < 0)
        {
            if(_IF_OR(e[i].t, TYPE_charset, TYPE_import, TYPE_namespace))
            {
                tmp = tabAdd + e[i]._s + " " + e[i].o + rowEnd;
                if(e[i].t === TYPE_charset)      cs += tmp;
                else if(e[i].t === TYPE_import) imp += tmp;
                else                             ns += tmp;
            }
            else
            {
                tmp = "";
                for(key in e[i].o)
                {
                    if(helperElemType(e[i].o[key]) !== _TYPE_Array)
                        tmp += tabAdd + tab + key + rowSep + e[i].o[key] + rowEnd;
                }
                if(e[i].c) 
                    tmp += _parse(index, getHandler(index, e[i], null, true), isMin, ignore, tabAdd + tab, tab);  
                
                if(tmp.length > 0)
                {
                    key = e[i]._s;
                    //if(!isMin && key.indexOf(",") > -1) key = key.replace(/,\s*/g, ",\n"+tabAdd);
                    tmp = tabAdd + key + ruleBeginn + tmp + tabAdd + ruleEnd;
                    
                    if(e[i].t === TYPE_fontFace) ff += tmp;
                    else                      rules += tmp;
                }
            }
            ignore.push(i);
        }
        return cs+imp+ns+ff+rules;
    }
    function _export(index, e, type, ignore, returnWithoutSelector)
    {
        if(helperElemType(type) !== _TYPE_Integer)
            type = TYPE_EXPORT[type] || TYPE_EXPORT_obj;
        
        if(_IF_OR(type, TYPE_EXPORT_css, TYPE_EXPORT_min))
            return _parse(index, e, type === TYPE_EXPORT_min);
        
        if(!ignore) ignore = [];
        
        var exportObj = type === TYPE_EXPORT_arr ? [] : {}, 
            obj, i=0, j, key, tmp, pre = {}, toAdd;
    
        
        for(; i < e.length; i++) if(e[i] && ignore.indexOf(i) < 0)
        {
            obj = {};
            if(_IF_OR(e[i].t, TYPE_charset, TYPE_import, TYPE_namespace)) 
            {
                obj = e[i].o;
                toAdd = true;
            }
            else 
            {
                toAdd = false;
                for(key in e[i].o)
                {
                    if(helperElemType(e[i].o[key]) === _TYPE_Array)
                    {
                        if(type === TYPE_EXPORT_obj)
                        {
                            obj[key] = _export(index, fromIndexKey(index, e[i].o[key]), type, ignore, true);
                            toAdd = true;
                        }
                    }
                    else
                    {
                        obj[key] = e[i].o[key] + (isFinite(e[i].o[key])?"!":"");
                        toAdd = true;
                    }
                }
            }

            if(e[i].c)
            {
                tmp = getHandler(index, e[i], null, true);
                if(tmp.length > 0)
                {
                    obj = _OBJECT_assign(_export(index, tmp, type, ignore, false), obj);
                    toAdd = true;
                }
            }

            if(toAdd)
            {
                if(type === TYPE_EXPORT_arr)
                {
                    tmp = {}; tmp[e[i]._s] = obj;
                    exportObj.push(tmp);
                }
                else
                {
                    tmp = PRE_IMPORT_KEYS.indexOf(e[i].s) < 0 ? exportObj : pre;
                    if(tmp[e[i]._s])
                    {
                        if(helperElemType(tmp[e[i]._s]) !== _TYPE_Array)
                            tmp[e[i]._s] = [tmp[e[i]._s]];
                        tmp[e[i]._s].push(obj);
                    }
                    else tmp[e[i]._s] = obj;
                }
            }
            ignore.push(i);
        }

        if(type === TYPE_EXPORT_arr) return exportObj;

        exportObj = _OBJECT_assign(pre, exportObj); 
        
        if(returnWithoutSelector)
        {
            tmp = false; j = 0;
            for(i in exportObj)
            {
                j++;
                if(j === 1) tmp = exportObj[i];
                else break;
            }
            if(j === 1) return tmp;
        }
        
        return exportObj;
    }
    function _update(index, e)
    {
        var i = 0, tmp, key;

        for(; i < e.length; i++) if(e[i])
        {
            if(e[i].uo !== false)
            {
                tmp = e[i].uo(e[i].s,_get(index,[e[i]])[e[i].s]); //object update
                for(key in tmp) _set(index, e, key, tmp[key], i, true);
            }

            if(e[i].c) _update(index, getHandler(index, e[i], null, true));
            else for(key in e[i].up)
                    _set(index, e, key, e[i].up[key](key,_get(index,[e[i]],key)), i, true);
        }
    }
    function _delete(index, e, prop, _this)
    {
        var isUndef = _IF_OR(helperElemType(prop), _TYPE_Null, _TYPE_Undefined), i = 0, _e = [];

        for(; i < e.length; i++) if(e[i])
        {
            if(e[i].c) _delete(index, getHandler(index, e[i], null, true), prop, _this);
            
            if(isUndef)
            {
                helperDeleteCSSRule(e[i].e);
                delFromIndex(e[i].p ? e[i].p : index[INDEX_OBJECT], e[i].s, e[i]);
            }
            else
            {
                _e.push(e[i]);
                if(!_ON_SERVER) e[i].e.style[prop] = "";
                
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
        if(p < 0) p += _OBJECT_keys(e).length;
        
        var i = 0, j = 0, obj = [];
        for(; i < e.length; i++) if(e[i])
        {
            if(p === j)
            {
                obj[i] = e[i];
                break;
            }
            j++;
        }
        return ruleHandler(index, obj, sel, false, parents);
    }
    function _getE(index, e)
    {
        var _e = [], i = 0;
        for(; i < e.length; i++) if(e[i]) 
            _e.push(_ON_SERVER || e[i].e.placeholder ? 
                            _export(index, [e[i]], TYPE_EXPORT_obj) : e[i].e
        ); return _e;
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
    function __alias(aliasObj, key, val)
    {
        var keyType = helperElemType(key), v, i, j;
    
        if(keyType === _TYPE_String)
        {
            v = {};
            v[key] = val;
            key = v;
            keyType = _TYPE_Object;
        }
        
        if(keyType === _TYPE_Object) for(i in key)
            {
                v = key[i];
                
                if(helperElemType(v) !== _TYPE_Array) v = [v];
                if(!(i in aliasObj)) aliasObj[i] = [];
                
                for(j = 0; j < v.length; j++) aliasObj[i].push(v[j]);
            }
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
            var i = 0, j, elArr = [], tmp;
            createRuleIfNotExists();

            for(; i < elems.length; i++) if(elems[i] && elems[i].c)
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
            'parse':  function(min)         { return _parse(index, elems, min); },
            'pos':    function(p)           { return _pos(index, elems, p, sel, parents); },
            'first':  function()            { return _pos(index, elems, 0, sel, parents); },
            'last':   function()            { return _pos(index, elems, -1, sel, parents); }
        });
        return handler;
    }
    function getController()
    {
        var index = [{},!1,[],{},{},{},[],{}],

        controller = function(sel)
        {
            try         { return handleSelection(index, sel, false, controller); }
            catch (err) { helperError("CSSC:"+err, index); }
        };
        helperDefineReadOnlyPropertys(controller, {
            version: VERSION,
            //core functions
            'init':   function(toInit)    { initElements(index, toInit); return controller; },
            'import': function(importObj) { handleImport(index, importObj, false); return controller; },
            'export': function(type)      { return _export(index, index[INDEX_GLOBAL], type); },
            'parse':  function(min)       { return _parse(index, index[INDEX_GLOBAL], min); },
            'update': function(sel)       { if(sel) handleSelection(index, sel).update(); else _update(index, index[INDEX_GLOBAL]); return controller; },
            'new':    function()          { return getController(); },
            //conf & vars
            alias:      function(key, val)  { __alias(index[INDEX_ALIAS], key, val); return controller; },
            conf:       function(cnf, val)  { return __confVars(index[INDEX_CONF], cnf, val, controller); },
            vars:       function(vars, val) { return __confVars(index[INDEX_VARS], vars, val, controller); },
            units:      function(key, unit) { return __confVars(index[INDEX_UNITS], key, unit, controller); },
            //helper functions
            parseVars:  function(txt, vars)        { return helperParseVars(txt, [,,,(vars?_OBJECT_assign({}, index[INDEX_VARS], vars):index[INDEX_VARS]),index[INDEX_CONF]]); },
            objFromCss: function(css)              { return helperObjFromCssText(css); },
            //cssFromObj: function(obj, min, tabLen) { return helperCssTextFromObj(obj, min, tabLen); },
            //config & defs
            _conf:       CONF_DEFAULT,
            type:        TYPE,
            type_export: TYPE_EXPORT_STR,
            messages:    MESSAGES
        });
        return controller.conf(CONF_DEFAULT);
    }
    
    if(_ON_SERVER) CONTEXT.exports = getController();
    else return getController();
    
})(typeof module === "undefined" ? document : module);
