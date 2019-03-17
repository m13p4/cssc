/**
 * CSSCParser - Parser / Importer for CSSC
 * 
 * ! development version
 * ! client-site only
 * 
 * @version 0.2a
 *
 * @author m13p4
 * @copyright Meliantchenkov Pavel
 * 
 * @requires CSSC
 */

var CSSCParser = (function()
{ 'use strict';
    
    if(typeof CSSC === "undefined") return;
    
    var PARSER_HEAD_open  = "<{",
        PARSER_HEAD_close = "}>",
        
        PARSER_CHAR_objOpen  = "{",
        PARSER_CHAR_objClose = "}",
        PARSER_CHAR_arrOpen  = "[",
        PARSER_CHAR_arrClose = "]",
        PARSER_REGEX_objArrOpenClose = /\{|\}|\[|\]/,
        
        PARSER_CHAR_funcArrow      = "=>",
        PARSER_CHAR_funcParamOpen  = "(",
        PARSER_CHAR_funcParamClose = ")",
        PARSER_CHAR_funcBodyOpen  = "{",
        PARSER_CHAR_funcBodyClose = "}",
        
        PARSER_CHAR_keyVal = ":",
        PARSER_CHAR_end = [";","\n"],
        
        PARSER_CHAR_commBegin = "/*",
        PARSER_CHAR_commEnd   = "*/",
        PARSER_CHAR_escape    = "\\",
        
        PARSER_REGEX_NEXT_POS = /:|\{|\}|\[|\]|;|\n|\/\*|\(/,
        PARSER_REGEX_END_ROW = /;|\n/,
        PARSER_REGEX_VAR_KEY = /^\$:[\w\.\-]+$/i,
        
        REGEX_TRIM = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,
        _STR_TRIM = ((String.prototype.trim) ? 
                        (function(s){ return s.trim(); }) : 
                        (function(s){ return s.replace(REGEX_TRIM, ''); })),
          
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
        PRE_IMPORT_KEYS = ["@charset", "@import", "@namespace", "@font-face"];
    
    function helperElemType(elem, asStr)
    {
        var type = Object.prototype.toString.call(elem).split(/ |\]/)[1];
        if(type === "Number" && !asStr) type = Math.floor(elem) === elem ? _TYPE_Integer : _TYPE_Float;
        return asStr ? type : (_TYPE[type] || type);
    }
    
    function httpRequest(url, callback)
    {
        var http = new XMLHttpRequest();
        
        if(http.overrideMimeType)
            http.overrideMimeType("text/plain");
        
        http.open("GET", url);
        http.send();
        
        if(callback) http.onreadystatechange = function()
        {
            this.readyState == 4 && 
            this.status == 200 && 
            callback(http.responseText);
        };
    }
    
    function findPos(regex, str, pos)
    {
        var _pos = str.substr(pos || 0).search(regex);
        
        return _pos < 0 ? _pos : pos + _pos;
    }
    
    var REGEX_FUNC_IdentifierKeys = /"|'|`|\{|\}/;
    function readFunction(str, pos, keysInfo)
    {
        var char, brkCnt = 0, beginPos = keysInfo[1], funcDefinition = [], inString = false, 
            isEscChar = function(i)
            {
                var res = false;
                
                for(i--; i > -1; i--)
                    if(str.charAt(i) === PARSER_CHAR_escape)
                        res = !res;
                    else break;
                    
                return res;
            },
            params = _STR_TRIM(str.substr(pos, keysInfo[0] - pos)).replace(/^\(|\)$/g,"").split(","), i = 0;
        
        for(; i < params.length; i++)
        {
            char = _STR_TRIM(params[i]);
            if(char.length > 0) 
                funcDefinition.push(char);
        }
        
        pos = keysInfo[1];
        
        var stop = 0;
        while((pos = findPos(REGEX_FUNC_IdentifierKeys, str, pos)) > -1)
        {
            char = str.charAt(pos);
            
            if(!inString && char === PARSER_CHAR_funcBodyOpen) // {
            {
                brkCnt++;
            }
            else if(!inString && char === PARSER_CHAR_funcBodyClose) // }
            {
                brkCnt--;
                
                if(brkCnt === 0) break; // end of function definition
            }
            else if(!inString && (char === "'" || char === '"' || char === "`") && !isEscChar(pos))
            {
                inString = char;
            }
            else if(char === inString && !isEscChar(pos))
            {
                inString = false;
            }
            
            stop++; if(stop > 1e2) break;
            
            pos++;
        }
        
        var funcStr = brkCnt === 0 ? str.substr(beginPos, pos - beginPos + 1) : str.substr(beginPos);
        
        funcDefinition.push(_STR_TRIM(_STR_TRIM(funcStr).replace(/^\{|\}$/g,"")));
        
//        console.log(funcDefinition);
        
        
        return [brkCnt === 0 ? pos : str.length, Function.apply(null, funcDefinition)];
    }
    
    
    function parseString(styleObj, str, isHead)
    {
        var obj = {}, objLegend = [], currObj = obj, currObjType = _TYPE_Object,
            pos = 0, lastPos = pos, key, val, char, tmp, inVar = false, inVarKey, startHandler, currHandler,
            _cssc = styleObj ? styleObj.cssc : false, useCssc = _cssc && !isHead, preImport = useCssc;
        
//        if(useCssc)
//        {
//            startHandler = _cssc({"*":{}}).last();
//            currHandler = startHandler;
//        }
        
        var stop = 0;
        while((pos = findPos(PARSER_REGEX_NEXT_POS, str, pos)) > -1)
        {
            char = str.charAt(pos);
            
            if(char === PARSER_CHAR_keyVal) // :
            {
                if(currObjType !== _TYPE_Object)
                {
                    pos++;
                    continue;
                }
                if(str.charAt(pos-1) === "$")
                {
                    //console.log(str.substr(pos-1, 20));
                    pos++;
                    continue;
                }
                
                tmp = [
                        findPos(PARSER_REGEX_END_ROW, str, pos+1),
                        findPos(PARSER_REGEX_objArrOpenClose, str, pos+1)
                      ];
                
                char = false;
                if(tmp[1] > -1 && tmp[0] > tmp[1])
                {
                    char = str.charAt(tmp[1]);
                    
                    if(char === PARSER_CHAR_objClose) tmp[0] = tmp[1];
                    else
                    {
                        pos++;
                        continue;
                    }
                }
                
                tmp = tmp[0] < 0 ? str.length : tmp[0];                
                val = _STR_TRIM(str.substr(pos+1, tmp - pos - 1));
                key = _STR_TRIM(str.substr(lastPos, pos - lastPos));
                var lala = 0;
                while(val.charAt(val.length - 1) === "\\")
                {
                    val = val.substr(0, val.length - 1);
                    
                    pos = findPos(PARSER_REGEX_END_ROW, str, tmp+1);
                    
                    val += _STR_TRIM(str.substr(tmp, pos - tmp));
                    
                    //console.log(val, ">>", tmp, pos, ">>", str.substr(tmp, pos - tmp));
                    
                    lala++; if(lala > 100) break;
                    
                    tmp = pos;
                }
                
                //if(preImport) console.log(key);
                if(preImport && !inVar && obj === currObj && PRE_IMPORT_KEYS.indexOf(key) < 0 && key.substr(0,2) !== "$:")
                {
                    //console.log(JSON.stringify(obj, true, 4));
                    preImport = false;
                    
                    if(useCssc)
                    {
                        _cssc(obj);
                        
                        startHandler = _cssc({"*":{}}).last();
                        currHandler = startHandler;
                    }
                }
                
                currObj[key] = val;
                
                if(useCssc && !preImport && !inVar) currHandler.set(key, val);
                
                pos = tmp - (char ? 1 : 0);
            }
            else if(char === PARSER_CHAR_funcParamOpen) // function
            {
                tmp = [
                        str.indexOf(PARSER_CHAR_funcArrow, pos+1),
                        str.indexOf(PARSER_CHAR_objOpen, pos+1)
                      ];
                
                if(tmp[0] > -1 && tmp[1] > -1 && tmp[1] > tmp[0])
                {
                    tmp = readFunction(str, pos, tmp);
                    
                    if(currObjType === _TYPE_Object)
                    {
                        key = _STR_TRIM(str.substr(lastPos, pos - lastPos));
                        
                        currObj[key] = tmp[1];
                    }
                    else currObj.push(tmp[1]);
                    
                    pos = tmp[0];
                }
                else
                {
                    pos++; 
                    continue;
                }
            }
            else if(char === PARSER_CHAR_objOpen) // {
            {
                objLegend.push([currObj, currHandler]);
                
                if(currObjType === _TYPE_Object)
                {
                    key = _STR_TRIM(str.substr(lastPos, pos - lastPos));
//                    console.log(">>> " + key, inVar);

                    

                    if(inVar || PARSER_REGEX_VAR_KEY.test(key)) // handle var set
                    {
                        if(!inVar)
                        {
                            inVar = currObj;
                            inVarKey = key;
                        }
                        
                        currObj[key] = {};
                        currObj = currObj[key];
//                        inVar = !inVar ? currObj : inVar;
                    }
                    else
                    {
                        if(!(key in currObj)) currObj[key] = [];
                        
                        if(preImport && obj === currObj && PRE_IMPORT_KEYS.indexOf(key) < 0 && key.substr(0,2) !== "$:")
                        {
                            //console.log(useCssc, obj); //JSON.stringify(obj, true, 4));
                            //return;
                            preImport = false;

                            if(useCssc)
                            {
                                _cssc(obj);

                                startHandler = _cssc({"*":{}}).last();
                                currHandler = startHandler;
                            }
                        }
                        
                        currObj = currObj[key][currObj[key].push({})-1];
                        
                        //console.log(key);
                        
                        if(useCssc && !preImport && !inVar)
                        {   
                            if(!currHandler || currHandler === startHandler)
                            {
                                tmp = {}; tmp[key] = {};
                                _cssc(tmp);
                            }
                            else currHandler.set(key, {}); 
                            
                            currHandler = _cssc.last();
                        }
                    }
                }
                else
                {
                    currObj = currObj[currObj.push({})-1];
                    
                    if(useCssc && !preImport && !inVar)
                    { 
                        //if(currHandler === startHandler)
                        //{
                            tmp = {}; tmp[currHandler.selector] = {};
                            _cssc(tmp);
                        //}
                        //else currHandler.set(currHandler.selector, {}); 

                        currHandler = _cssc.last();
                    }
                }
                
                currObjType = _TYPE_Object;
            }
            else if(char === PARSER_CHAR_arrOpen) // [
            {
                objLegend.push([currObj, currHandler]);
                
                if(currObjType === _TYPE_Object)
                {
                    key = _STR_TRIM(str.substr(lastPos, pos - lastPos));
                    
                    if(PARSER_REGEX_VAR_KEY.test(key)) // handle var
                    {
                        inVar = currObj;
                        inVarKey = key;
                    }
                    
                    if(preImport && !inVar && obj === currObj && PRE_IMPORT_KEYS.indexOf(key) < 0 && key.substr(0,2) !== "$:")
                    {
                        //console.log(useCssc, obj); //JSON.stringify(obj, true, 4));
                        //return;
                        preImport = false;

                        if(useCssc)
                        {
                            _cssc(obj);

                            startHandler = _cssc({"*":{}}).last();
                            currHandler = startHandler;
                        }
                    }
                    
                    if(helperElemType(currObj) !== _TYPE_Array) currObj[key] = [];

                    currObj = currObj[key];
                    
                    if(useCssc && !preImport && !inVar)
                    { 
                        if(currHandler === startHandler)
                        {
                            tmp = {}; tmp[key] = {};
                            _cssc(tmp);
                        }
                        else currHandler.set(key, {}); 

                        currHandler = _cssc.last();
                    }
                }
                else currObj = currObj[currObj.push([])-1];
                
                currObjType = _TYPE_Array;
            }
            else if(char === PARSER_CHAR_objClose || char === PARSER_CHAR_arrClose) // } || ]
            {
                if(currObjType === _TYPE_Array)
                {
                    val = _STR_TRIM(str.substr(lastPos, pos - lastPos));
                    val && currObj.push(val);
                }
                
                
                currObj     = objLegend.pop();
                currHandler = currObj[1];
                currObj     = currObj[0];
                currObjType = helperElemType(currObj);
                
                
                if(inVar === currObj) 
                {
                    inVar = false;
                    if(useCssc && !preImport) startHandler.set(inVarKey, currObj[inVarKey]);
                }
                
            }
            else if(char+str.charAt(pos+1) === PARSER_CHAR_commBegin) // /* ... */
            {
                tmp = str.indexOf(PARSER_CHAR_commEnd, pos+2);
                pos = tmp < 0 ? str.length : tmp;
            }
            else if(currObjType === _TYPE_Array && PARSER_CHAR_end.indexOf(char) > -1) // ; || \n
            {
                val = _STR_TRIM(str.substr(lastPos, pos - lastPos));
                val && currObj.push(val);
            }
            
            stop++; if(stop > 1e3) break;
            
            lastPos = ++pos;
        }
        
//        console.log("Cnt: " + stop);
        
        return obj;
    }
    
    var headConfMapper = {
        id: "style_id",
        
        "view-err":     "view_err",
        "parse-tab":    "parse_tab",
        "unit-default": "parse_unit_default",
        "vars-limit":   "parse_vars_limit"
    };
    function parseStringHead(styleObj, headStr)
    {
        var head = styleObj.head, key, i,
            _head = parseString(styleObj, headStr, true),
            reverseUnitsKey = "runits";
        
        for(key in _head) 
            if(key === reverseUnitsKey) 
                continue;
            else if(key in head) //for(i = 0; i < )
                setConf(head[key], _head[key]);
            else 
                head.conf[(key in headConfMapper) ? headConfMapper[key] : key] = _head[key];

        if(reverseUnitsKey in _head) parseReverseUnits(_head[reverseUnitsKey][0], head.units);
    }
    
    function parseStringBody(styleObj, bodyStr)
    {
        styleObj.body = parseString(styleObj, bodyStr, false);
    }
    
    function removeComments(str)
    {
        var from, to, addLen = PARSER_CHAR_commEnd.length;
        
        while((from = str.indexOf(PARSER_CHAR_commBegin)) > -1)
        {
            to = str.indexOf(PARSER_CHAR_commEnd, from + addLen);
            
            str = str.substr(0, from) + (to < 0 ? "" : str.substr(to + addLen));
        }
        
        return str;
    }
    
    function parseReverseUnits(runits, units)
    {
        var unit, keys, key, i;
        
        for(unit in runits) 
        {
            keys = runits[unit].split(",");
            
            for(i = 0; i < keys.length; i++)
            {
                key = _STR_TRIM(keys[i]);
                
                if(key && !(key in units)) units[key] = unit;
            }
        }
        
        return units;
    }
    
    function setConf(cnf, toSet)
    {
        toSet = helperElemType(toSet) === _TYPE_Array ? toSet : [toSet];
        
        for(var i = 0, key; i < toSet.length; i++) 
            for(key in toSet[i]) cnf[key] = toSet[i][key];
    }
    
    var _default = {
        head: {
            conf:  {},
            vars:  {},
            units: {}
        },
        body: {},

        parse: false
    };
    
    function setStyleObj(obj, setObj)
    {
        var key, headKey;
        
        for(key in setObj)
        {
            if(key === "head") 
            {
                if(!obj[key]) obj[key] = {};
                
                for(headKey in setObj[key]) 
                    obj[key][headKey] = setObj[key][headKey];
            }
            else obj[key] = setObj[key];
        }
        
        return obj;
    }
    
    function parseStringInputStyle(str, callback)
    {
        var styleObj = setStyleObj({
                            source: str,
                            css:   "",
                            cssc: new CSSC(),
                        }, _default), 
            headStr = "", bodyStr = str; 
        
        str = _STR_TRIM(removeComments(str));
        
        if(str.substr(0, 2) === PARSER_HEAD_open)
        {
            var closePos = str.indexOf(PARSER_HEAD_close);
            
            if(closePos < 0) throw new Error('Missing HEAD_CHAR_Close "'+PARSER_HEAD_close+'"');
            
            headStr = _STR_TRIM(str.substr(PARSER_HEAD_open.length, closePos - PARSER_HEAD_close.length));
            bodyStr = _STR_TRIM(str.substr(closePos + PARSER_HEAD_close.length));
        }
        else if(str.indexOf(PARSER_HEAD_close) > -1)
            throw new Error('Missing HEAD_CHAR_Open "'+PARSER_HEAD_open+'"');
        
        parseStringHead(styleObj, headStr);
        
        //console.log(styleObj);
        styleObj.cssc.conf(styleObj.head.conf)
                     .vars(styleObj.head.vars)
                     .units(styleObj.head.units);
                     //(styleObj.body);
                     
        parseStringBody(styleObj, bodyStr);
                        
        styleObj.css = styleObj.parse && styleObj.cssc.parse() || "";
        
        //console.log(styleObj);
        
        if(callback) callback(styleObj);
    }
    
    
    
    function importer()
    {
        
    }
    
    importer.parseString = function(str){ parseStringInputStyle(str); return importer; };
    importer.parseStringURL = function(url, callback){ httpRequest(url, function(str){ parseStringInputStyle(str, callback); }); return importer; };
    
    importer.setDefault = function(defObj){ setStyleObj(_default, defObj); return importer; };
    
    return importer;
})();
