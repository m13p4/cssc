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
    
    var index   = {},
        cssc    = null,
        ownStyleElem;

    var //helper
    helperElemType = function(elem, returnFullValue)
    {
        if(returnFullValue) return Object.prototype.toString.call(elem);
        return Object.prototype.toString.call(elem).replace(/(^\[.+\s|\]$)/g,"");
    },
    helperCreateNewStyleElem = function()
    {
        if(!!document.getElementById(cssc.conf.styleId))
        {
            for(var i = 0; i < 10; i++)
            {
                if(!document.getElementById(cssc.conf.styleId+'-'+i))
                {
                    cssc.conf.styleId = cssc.conf.styleId+'-'+i;
                    break;
                }
            } 

            if(!!document.getElementById(cssc.conf.styleId))
            {
                throw new Error("cann not create new element..");
            }
        }

        var styleElem = document.createElement("style");
        styleElem.setAttribute("type", "text/css");
        styleElem.setAttribute("id", cssc.conf.styleId);
        styleElem.appendChild(document.createTextNode(""));

        document.head.appendChild(styleElem);

        ownStyleElem = styleElem;
    },
    helperIsElemInOwnNode = function(elem)
    {
        return (elem && !!elem.parentStyleSheet 
                && !!elem.parentStyleSheet.ownerNode 
                && elem.parentStyleSheet.ownerNode.id === cssc.conf.styleId);
    },
    helperParseValue = function(value)
    {
        if(isFinite(value))
        {
            if(value%1 === 0)
                return value + "px";

            return (Math.floor(value * 100) / 100) + "px";
        }
        else if(helperElemType(value) === "String")
        {
            var v = value.split(" ");

            if(v.length > 0)
            {
                var tmp;

                for(var i = 0; i < v.length; i++)
                {
                    if(isFinite(v[i]))
                    {
                        tmp = v[i];

                        if(tmp%1 === 0) 
                            v[i] = tmp + "px";
                        else            
                            v[i] = (Math.floor(tmp * 100) / 100) + "px";
                    }
                }

                return v.join(" ");
            }
        }

        return value;
    },
    helperObjFromCssText = function(cssText)
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
    },
    helperCssTextFromObj = function(obj, addTab, type)
    {
        var cssText = "", tab = "  ", key, obKey, elType, i, tmp;

        addTab = addTab || "";

        if(helperElemType(obj) === "String")
            return obj;

        for(key in obj)
        {
            obKey = obj[key];
            elType = helperElemType(obj[key]);

            if(elType === "Object" || elType === "Array")
            {
                if(elType === "Object")
                    obKey = [obj[key]];

                for(i = 0; i < obKey.length; i++)
                {
                    if(key === "@namespace" || key === "@import" || key === "@charset")
                    {
                        cssText += key+" "+obKey[i]+";"+(type === cssc.export.type.min?'':"\n");
                        continue;
                    }

                    tmp = helperCssTextFromObj(obKey[i], addTab+tab, type);

                    if(tmp !== "")
                    {
                        if(type === cssc.export.type.min)
                            cssText += key+"{"+tmp+"}";
                        else 
                            cssText += addTab+key.replace(/\s*,\s*/g, ",\n"+addTab)+" {\n"+tmp+addTab+"}\n";
                    }
                }
            }
            else
            {
                if(key === "@namespace" || key === "@import" || key === "@charset")
                    cssText += key+" "+obKey+";"+(type === cssc.export.type.min?'':"\n");
                else if(type === cssc.export.type.min)
                    cssText += key+":"+obKey+";";
                else cssText += (addTab.length < tab.length ? tab : addTab)
                             + key+": "+obKey+";\n";
            }
        }

        return cssText;
    },
    helperFindPropInCssText = function(cssText, prop)
    {
        var regExp = new RegExp(prop+"\s*:\s*(.+?);"),
            find = cssText.match(regExp);

        return !!find ? find[1].trim() : "";
    },
    helperSelectorType = function(sel)
    {
        sel = sel.trim();

        if(sel.charAt(0) !== "@")
            return cssc.type.rule;

        sel = sel.substr(1);

        var selIO = sel.indexOf(" "), key;

        if(selIO >= 0)
            sel = sel.substr(0, selIO);

        key = sel;

        if(sel.indexOf("-") >= 0)
        {
            var splSel = sel.split("-"), i;

            key = splSel[0];

            for(i = 1; i < splSel.length; i++)
                key += splSel[i].charAt(0).toUpperCase()+splSel[i].substr(1);
        }

        return (key in cssc.type) ? cssc.type[key] : -1;
    },
    helperGenSelector = function(pSel, sel)
    {
        if(sel.charAt(0) === "@" && pSel.charAt(0) === "@")
            sel = sel.substr(1);

        if(sel.charAt(0) === "/")
            sel = sel.substr(1);
        else if(sel.charAt(0) === ",")
            sel = ", "+sel.substr(1).trim();
        else
            sel = " " + sel;

        if(pSel.indexOf(",") >= 0 || sel.indexOf(",") > 0)
        {
            var pSelSplit = pSel.split(","), i, newSel = "",
                selSplit = sel.split(","), j;

            if(sel.charAt(0) !== ",")
                for(i = 0; i < pSelSplit.length; i++)
                    for(j = 0; j < selSplit.length; j++)
                        newSel += pSelSplit[i] + selSplit[j] + ", ";
            else
                for(i = 0; i < pSelSplit.length; i++)
                    newSel += pSelSplit[i] + sel + ", ";

            return newSel.replace(/,+\s*$/,"");
        }

        return pSel + sel;
    },
    helperDeleteCSSRule = function(cssRule)
    {
        var parent = !!cssRule.parentRule ? cssRule.parentRule : cssRule.parentStyleSheet, i;

        for(i = 0; i < parent.cssRules.length; i++)
            if(parent.cssRules[i] === cssRule)
                parent.deleteRule(i);
    },
    helperParseVars = function(str, vars)
    {
        if(!vars) vars = {};
        if(!str)  str = "";

        var varStart = str.lastIndexOf("$"), varEnd, 
            c = 0, v, xyz, tmp, key, type;

        while(varStart >= 0 && c < 100)
        { c++;
            
            if(str.charAt(varStart-1) !== "\\")
            {
                v = null;
                tmp = str.substr(varStart+1);

                varEnd = tmp.search(/\W/); 

                if(varEnd < 0) varEnd = str.length;
                else varEnd += varStart;

                key = str.substr(varStart+1, varEnd-varStart);

                if(key in vars)             v = vars[key];
                else if(key in cssc.vars)   v = cssc.vars[key];
                else                        v = "$"+key;

                type = helperElemType(v);

                if(str.charAt(varEnd+1) === "(" && type === "Function")
                {
                    varEnd++;

                    tmp = varEnd;
                    xyz = varEnd;

                    while(true)
                    {
                        xyz = str.indexOf("(", xyz+1);
                        varEnd = str.indexOf(")", varEnd+1);

                        if(xyz > -1 && xyz < varEnd) continue;
                        else break;
                    }

                    if(varEnd < 0) varEnd = str.length;

                    tmp = str.substr(tmp+1, varEnd-tmp-1);
                    tmp = tmp.trim().split(/\s*,\s*/);

                    v   = v.apply(null, tmp);
                }
                else if(type === "Function") 
                    v = v();

                str = str.substr(0, varStart) + v + str.substr(varEnd+1);
                
                if('$'+key === v)   varStart--;
                if(varStart === -1) break;
            }
            
            varStart = str.lastIndexOf("$", varStart);
        }
        
        return str;
    };

    var initElements = function(toInit)
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
                    indexCssRules(toInit[i].cssRules, null);
                }
                catch(err)
                {
                    if(cssc.conf.viewErr) console.log("Cannot init CSS from \""+toInit[i].href+"\"");
                    cssc.messages.push("Cannot init CSS from \""+toInit[i].href+"\"");
                }
            }
        }
    },
    indexCssRules = function(cssRules, parent)
    {
        for(var i = 0; i < cssRules.length; i++)
            if(!helperIsElemInOwnNode(cssRules[i]))
                addToIndex(cssRules[i], parent);
    },
    addToIndex = function(cssRule, parent, csscSelector)
    {
        var indexKey  = cssRule.cssText.substr(0, cssRule.cssText.indexOf("{")).trim(),
            indexType = cssRule.type, 
            toIndex   = cssRule,
            _index    = (!!parent ? parent.children : index),
            indexObjWrapper, indexC;

        //@todo: support all types
        if(indexType !== cssc.type.rule 
        && indexType !== cssc.type.fontFace 
        && indexType !== cssc.type.media
        && indexType !== cssc.type.keyframes
        && indexType !== cssc.type.keyframe
        && indexType !== cssc.type.page
        && indexType !== cssc.type.supports
        && indexType !== cssc.type.namespace
        && indexType !== cssc.type.import
        && indexType !== cssc.type.charset)
        {
            console.log("unsuported type: [" + indexType + "] - " + cssc.type.names[indexType]);
            return;
        }

        if(indexType === cssc.type.namespace)
            indexKey = "@namespace";
        if(indexType === cssc.type.import)
            indexKey = "@import";
        if(indexType === cssc.type.charset)
            indexKey = "@charset";

        toIndex._update = false;
        if(indexType === cssc.type.rule)
            toIndex.style._update = {};

        indexObjWrapper = {
            indexElem: toIndex,
            selector: indexKey,
            csscSelector: csscSelector ? csscSelector : indexKey,
            children: false,
            parent: (!!parent ? parent : false),
            events: {},
            obj: {},
            type: indexType
        };

        if(!!_index[indexKey])
        {
            if(_index[indexKey].content[0].indexElem === toIndex)
            {
                console.log("Dublicate \""+indexKey+"\": ");
                var a = new Error();
                console.log(a.stack+"\n\n");
            }

            indexC = (_index[indexKey].content.push(indexObjWrapper) - 1);
        }
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
        if(indexType === cssc.type.media 
        || indexType === cssc.type.keyframes 
        || indexType === cssc.type.supports)
        {
            _index[indexKey].content[indexC].children = {};

            indexCssRules(cssRule.cssRules, _index[indexKey].content[indexC]);
        }
        else
            _index[indexKey].content[indexC].obj = helperObjFromCssText(cssRule.cssText);

        return _index[indexKey];
    },
    createRule = function(selector, property, value, parent)
    {
        var appendToElem;

        if(!parent && !ownStyleElem)
            helperCreateNewStyleElem();

        appendToElem = !!parent ? parent.indexElem : ownStyleElem.sheet;

        var rulePos = appendToElem.cssRules.length,
            ruleString = "";

        if(!!property)
        {
            var propType = helperElemType(property);

            if(propType === "Object")
            {
                var prop;

                for(var key in property)
                {
                    if(helperElemType(property[key]) === "Function")
                    {
                        prop = property[key]();

                        ruleString += key+":"+prop+"; ";
                    }
                    else
                        ruleString += key+":"+property[key]+"; ";
                }
            }
            else if(propType === "Function")
            {
                var prop = property();

                for(var key in prop)
                    ruleString += key+":"+prop[key]+"; ";
            }
            else
                ruleString = property+":"+value+";";
        }

        try
        {
            var insRuleString = selector+"{"+ruleString+"}";

            if(selector === "@namespace" || selector === "@import" || selector === "@charset")
                insRuleString = selector+" "+property;

            if(selector !== "@charset")
            {
                if("insertRule" in appendToElem)
                    appendToElem.insertRule(insRuleString, rulePos);
                else if("appendRule" in appendToElem)
                    appendToElem.appendRule(insRuleString, rulePos);
                else if("addRule" in appendToElem)
                    appendToElem.addRule(selector, ruleString, rulePos);


                return addToIndex(appendToElem.cssRules[rulePos], parent, selector);
            }
            else return addToIndex({
                                csscSelector: selector,
                                cssText: insRuleString,
                                parent: false,
                                type: cssc.type.charset,
                                cssRules: {}
                            }, parent, key);
        }
        catch(err)
        {
            var errTxt = (parent ? '"' + parent.selector + '" > ' : '')
                         + "\"" + selector + "\" -> " + err;

            if(cssc.conf.viewErr) console.log(errTxt);
            cssc.messages.push(errTxt);
        }

        return false;
    },
    getFromIndex = function(sel, indexElem)
    {
        var _index = !!indexElem ? indexElem : index;
        return !!_index[sel] ? _index[sel] : null;
    },
    delFromIndex = function(sel, indexElem, toDel)
    {
        var _index = !!indexElem ? indexElem : index, tmp;

        if(!!_index[sel])
        {
            tmp = (toDel ? _index[sel].content.indexOf(toDel) : -1);

            if(!toDel) delete _index[sel];
            else if(tmp >= 0)
            {

                _index[sel].content.splice(tmp, 1);

                if(_index[sel].content.length <= 0)
                    delete _index[sel];
            }
        }
    },
    getHandler = function(sel, indexElem, getElements)
    {
        var _index = !!indexElem ? indexElem : index,
            selType = helperElemType(sel); 

        if(selType === "String")
        {
            var iElem = getFromIndex(sel, _index);

            if(!!getElements)
            {
                return (!!iElem ? iElem.content : []);
            }
            return ruleHandler((!!iElem ? iElem.content : []), sel);
        }
        else if(selType === "RegExp")
        {
            var matches = [], key;

            for(key in _index)
            {
                if(!!key.match(sel))
                {
                    for(i = 0; i < _index[key].content.length; i++)
                    {
                        matches.push(_index[key].content[i]);
                    }
                }
            }

            if(!!getElements)
            {
                return matches;
            }

            return ruleHandler(matches, sel);
        }
        else if(selType === "Array")
        {
            var matches = [], i, j, tmp;

            for(i = 0; i < sel.length; i++)
            {
                tmp = getFromIndex(sel[i], _index);

                if(tmp !== null)
                {
                    for(j = 0; j < tmp.content.length; j++)
                    {
                        matches.push(tmp.content[j]);
                    }
                }
            }

            if(!!getElements)
            {
                return matches;
            }

            return ruleHandler(matches, sel);
        }
        else if(selType === "Null" || selType === "Undefined")
        {
            var matches = [], key;

            for(key in _index)
            {
                for(i = 0; i < _index[key].content.length; i++)
                {
                    matches.push(_index[key].content[i]);
                }
            }

            if(!!getElements)
            {
                return matches;
            }

            return ruleHandler(matches, sel);
        }

        return null;
    },
    handleSelection = function(sel, hasProp, indexElem, getElements)
    {
        var ret, selType = helperElemType(sel);

        if(selType === "String" 
        || selType === "RegExp"
        || selType === "Array"
        || selType === "Null"
        || selType === "Undefined")
        {
            ret = getHandler(sel, indexElem, getElements);
        }
        else
        {
            handleImport(sel);

            return;
        }

        //return Elements with hasProp
        if(!!hasProp)
        {
            return ret.has(hasProp);
        }

        return ret;
    },
    handleImport = function(importObj, parent)
    {
        var importElem, rule, handlerObj, key, i, tmp, rcl;

        for(key in importObj)
        {
            if(helperElemType(importObj[key]) === "Array")
                importElem = importObj[key];
            else
                importElem = [importObj[key]];

            key = helperParseVars(key);

            for(i = 0; i < importElem.length; i++)
            {
                if(key.charAt(0) === "@")
                {
                    if(key === "@font-face" || key === "@namespace" || key === "@import" || key === "@charset")
                    {
                        createRule(key, importElem[i], null, parent);
                    }
                    else if(key.match(/^@(media|keyframes|supports)/) 
                            || (parent && (parent.type === cssc.type.media
                                        || parent.type === cssc.type.keyframes
                                        || parent.type === cssc.type.supports)
                               )
                    )
                    {
                        tmp = parent;
                        handlerObj = key; //use handlerObj var to save old key

                        if(parent && !handlerObj.match(/^@(media|keyframes|supports)/))
                        {
                            key = helperGenSelector(parent.csscSelector, key);

                            tmp = parent.parent;
                        }

                        rule = createRule(key, null, null, tmp);

                        if(rule && rule.content[rule.content.length - 1].selector === rule.content[rule.content.length - 1].csscSelector)
                        {
                            handleImport(importElem[i], rule.content[rule.content.length - 1]);
                        }
                        else
                        {
                            if(rule)
                            {
                                rcl = rule.content.length - 1;

                                helperDeleteCSSRule(rule.content[rcl].indexElem);

                                delFromIndex(rule.content[rcl].selector, 
                                             rule.content[rcl].parent, 
                                             rule.content[rcl]);
                            }

                            tmp = {
                                csscSelector: key,
                                cssText: key + " {}",
                                parent: tmp || false,
                                type: helperSelectorType(key),
                                cssRules: {}
                            };

                            rule = addToIndex(tmp, tmp.parent, key);

                            handleImport(importElem[i], rule.content[rule.content.length - 1]);
                        }

                        if(!!parent)
                        {
                            if(!parent.obj[handlerObj])
                                parent.obj[handlerObj] = [];

                            parent.obj[handlerObj].push(rule.content[rule.content.length - 1]);
                        }
                    }
                }
                else
                {
                    rule = createRule(key, null, null, parent);

                    if(rule)
                    {
                        handlerObj = ruleHandler([rule.content[rule.content.length-1]], key);

                        handlerObj.set(importElem[i]);
                    }
                }
            }
        }
    },
    ruleHandler = function(indexElemArr, sel, fromHas, parents)
    {
        var handler,
        createRuleIfNotExists = function()
        {
            if(handler.e.length <= 0 && !fromHas && helperElemType(sel) === "String")
            {
                var rule, contentElems = [], i, key;

                if(!parents)
                {
                    rule = createRule(sel, null, null);

                    if(rule) contentElems = rule.content;
                }
                else
                {
                    for(i = 0; i < parents.length; i++)
                    {
                        rule = createRule(sel, null, null, parents[i]);

                        if(rule) for(key = 0; key < rule.content.length; key++)
                            contentElems.push(rule.content[key]);
                    }
                }

                handler.e = contentElems;
                handler.eLength = contentElems.length;
            }
        };

        handler = function(sel, hasProp)
        {
            var i, j, elArr = [], tmp;

            createRuleIfNotExists();

            for(i = 0; i < handler.e.length; i++)
            {
                if(!!handler.e[i].children)
                {
                    tmp = handleSelection(sel, hasProp, handler.e[i].children, true);

                    for(j = 0; j < tmp.length; j++)
                        elArr.push(tmp[j]);
                }
            }
            return ruleHandler(elArr, sel, null, handler.e);
        };

        handler.e = indexElemArr;
        handler.eLength = indexElemArr.length;

        handler.set = function(prop, val, pos)
        {
            if(typeof pos === "number") // single Set
            {
                if(this.e[pos].indexElem.type === cssc.type.fontFace)
                {
                    if(cssc.conf.viewErr)
                        console.log("Element of Type \""+cssc.type.names[this.e[pos].indexElem.type]+"\" is readonly.");
                    cssc.messages.push("Element of Type \""+cssc.type.names[this.e[pos].indexElem.type]+"\" is readonly.");

                    return this;
                }

                prop = helperParseVars(prop);

                if(!!this.e[pos].children)
                {
                    var childHandler = getHandler(null, this.e[pos].children);
                    childHandler.set(prop, val);
                }
                else 
                {
                    var prsVal, valType = helperElemType(val), tmp;

                    if(valType === "Object" || valType === "Array")
                    {
                        var newSel = helperGenSelector(this.e[pos].selector, prop), pObj,
                            valArr = valType === 'Object' ? [val] : val, rule, i, handlerObj;

                        for(i = 0; i < valArr.length; i++)
                        {
                            tmp = null;

                            if(prop.charAt(0) === "@")
                            {
                                handlerObj = getHandler(
                                                    this.e[pos].parent ? 
                                                        helperGenSelector(this.e[pos].parent.selector, prop) 
                                                    : prop);
                                handlerObj = handlerObj(this.e[pos].selector);

                                handlerObj.set(valArr[i]);

                                tmp = handlerObj.e[handlerObj.e.length-1];

                                if(this.e[pos].parent)
                                {
                                    pObj = this.e[pos].parent;

                                    if(!pObj.obj[prop] || !("push" in pObj.obj[prop]))
                                        pObj.obj[prop] = [];

                                    pObj.obj[prop].push(tmp.parent);
                                }
                            }
                            else
                            {
                                rule = createRule(newSel, null, null, this.e[pos].parent);

                                if(rule)
                                {
                                    handlerObj = ruleHandler([rule.content[rule.content.length-1]], key);
                                    handlerObj.set(valArr[i]);

                                    tmp = rule.content[rule.content.length-1]
                                }
                            }

                            if(tmp !== null)
                            {
                                if(!this.e[pos].obj[prop] || !("push" in this.e[pos].obj[prop]))
                                    this.e[pos].obj[prop] = [];
                                this.e[pos].obj[prop].push(tmp);
                            }
                        }
                    }
                    else if(valType === "Function")
                    {
                        var oldVal = this.pos(pos).get(prop), valToSet;

                        try
                        {
                            valToSet = val(oldVal);

                            this.set(prop, valToSet, pos);
                            this.e[pos].indexElem.style._update[prop] = val;
                        }
                        catch(err)
                        {
                            if(cssc.conf.viewErr) console.log(err);
                            cssc.messages.push(err);
                        }
                    }
                    else
                    {
                        prsVal = helperParseValue(val);

                        this.e[pos].indexElem.style[prop] = prsVal;
                        this.e[pos].obj[prop] = prsVal;
                    }
                }
            }
            else // multi Set
            {
                var i, propLen, key, props,
                    propType = helperElemType(prop);

                if(propType === "Object")
                    propLen = Object.keys(prop).length;
                else if(propType === "Function")
                    props = prop();

                createRuleIfNotExists();

                if(propType === "Array" 
                || (propType === "Function" && helperElemType(props) === "Array"))
                {
                    var elH, prp = (propType === "Array" ? prop : props);
                    for(i = 0; i < prp.length; i++)
                    {
                        elH = this.pos(i);

                        if(elH.e.length === 1)
                            elH.set(prp[i]);
                        else 
                            break;
                    }
                }
                else
                {
                    for(i = 0; i < this.e.length; i++)
                    {
                        if(propType === "Object" && propLen > 0) 
                        {
                            for(key in prop)
                            {
                                this.set(key, prop[key], i);
                            }
                        }
                        else if(propType === "Function")
                        {
                            for(key in props)
                            {
                                this.set(key, props[key], i);
                            }

                            //add to updatable
                            this.e[i].indexElem._update = prop;
                        }
                        else
                        {
                            this.set(prop, val, i);
                        }
                    }
                }
            }
            return this;
        };
        handler.get = function(prop, returnAllProps)
        {
            if(!prop) return this.export(cssc.export.type.object);

            var arrToRet = [], propToRet = "", tmp, i, expObj;

            returnAllProps = !!returnAllProps;

            for(i = 0; i < this.e.length; i++)
            {
                tmp = "";

                if(this.e[i].obj[prop]) 
                {
                    tmp = this.e[i].obj[prop];

                    if(helperElemType(tmp) === "Array")
                    {
                        expObj = ruleHandler(tmp);
                        tmp = expObj.export(cssc.export.type.object);
                    }
                }

                if(!tmp || tmp === "")
                    tmp = this.e[i].indexElem.style[prop];

                //use helper, if property value not found in style object (margin, padding, border, etc..)
                if(!tmp || tmp === "")
                    tmp = helperFindPropInCssText(this.e[i].indexElem.cssText, prop);

                if(!!tmp)
                {
                    propToRet = tmp;

                    if(returnAllProps) arrToRet.push(propToRet);
                }
            }
            return returnAllProps ? arrToRet : propToRet;
        };
        handler.has = function(prop)
        {
            var matches = [], propVal, i, tmp,
                propType = helperElemType(prop);

            if(propType === "String")
            {
                propVal = prop.split(":");

                for(i = 0; i < this.e.length; i++)
                {
                    tmp = helperFindPropInCssText(this.e[i].indexElem.cssText, propVal[0]);

                    if(tmp !== "" && ((!propVal[1]) || (!!propVal[1] && propVal[1].replace(/ |;/g,"") === tmp)))
                    {
                        matches.push(this.e[i]);
                    }
                }
            }
            else if(propType === "Array")
            {
                for(var j = 0; j < prop.length; j++)
                {
                    propVal = prop[j].split(":");

                    for(i = 0; i < this.e.length; i++)
                    {
                        tmp = helperFindPropInCssText(this.e[i].indexElem.cssText, propVal[0]);

                        if(tmp !== "" && ((!propVal[1]) || (!!propVal[1] && propVal[1].replace(/ |;/g,"") === tmp)))
                        {
                            matches.push(this.e[i]);
                        }
                    }
                }
            }
            else if(propType === "RegExp")
            {
                var m, j;

                for(i = 0; i < this.e.length; i++)
                {
                    m = this.e[i].indexElem.cssText.match(/[\S]+:.+?;/g);

                    if(!!m)
                    {
                        for(j = 0; j < m.length; j++)
                        {
                            tmp = m[j].match(prop);

                            if(!!tmp) matches.push(this.e[i]);
                        }
                    }
                }
            }

            return ruleHandler(matches, sel, true);
        };
        handler.update = function()
        {
            var i, tmp, key;

            for(i = 0; i < this.e.length; i++)
            {
                if(this.e[i].indexElem._update !== false)
                {
                    tmp = this.e[i].indexElem._update();

                    for(key in tmp)
                        this.set(key, tmp[key], i);
                }

                if(!!this.e[i].children)
                {
                    var childHandler = getHandler(null, this.e[i].children);
                    childHandler.update();
                }
                else if(!!this.e[i].indexElem.style)
                {
                    for(key in this.e[i].indexElem.style._update)
                    {
                        tmp = this.e[i].indexElem.style._update[key]();
                        this.set(key, tmp, i);
                    }
                }
            }
            return this;
        };
        handler.delete = function(prop)
        {
            var i;

            if(typeof prop === "undefined")
            {
                for(i = 0; i < this.e.length; i++)
                {
                    helperDeleteCSSRule(this.e[i].indexElem);

                    delFromIndex(this.e[i].selector, (!!this.e[i].parent ? this.e[i].parent : null), this.e[i]);

                    if(!!this.e[i].children)
                    {
                        var childHandler = getHandler(null, this.e[i].children);
                        childHandler.delete(prop);
                    }
                }
            }
            else
            {
                for(i = 0; i < this.e.length; i++)
                {
                    this.e[i].indexElem.style[prop] = "";

                    if(!!this.e[i].children)
                    {
                        var childHandler = getHandler(null, this.e[i].children);
                        childHandler.delete(prop);
                    }
                }
            }
            return this;
        };
        handler.export = function(type, ignore)
        {
            var exportObj = {}, obj, childHandler, i, j, key, tmp, _type = type;

            if(type === cssc.export.type.obj)
                type = cssc.export.type.object;

            if(type === cssc.export.type.normal || type === cssc.export.type.min)
                type = cssc.export.type.notMDObject;

            if(!ignore) ignore = [];

            for(i = 0; i < this.e.length; i++)
            {
                if(ignore.indexOf(this.e[i]) >= 0) continue; 

                if(this.e[i].type === cssc.type.namespace 
                || this.e[i].type === cssc.type.import 
                || this.e[i].type === cssc.type.charset)
                    obj = this.e[i].obj;
                else
                {
                    obj = Object.assign({}, this.e[i].obj);

                    for(key in this.e[i].obj)
                    {
                        if(typeof this.e[i].obj[key] === "object" 
                        && "length" in this.e[i].obj[key])
                        {
                            if(type === cssc.export.type.notMDObject)
                            {
                                obj[key] = null;
                                delete obj[key];

                                continue;
                            }

                            obj[key] = [];

                            for(j = 0; j < this.e[i].obj[key].length; j++)
                            {
                                if(ignore.indexOf(this.e[i].obj[key][j]) >= 0) continue; 

                                tmp = ruleHandler([this.e[i].obj[key][j]]);
                                tmp = tmp.export(type, ignore)[this.e[i].obj[key][j].selector];

                                ignore.push(this.e[i].obj[key][j]);

                                if(!tmp || Object.keys(tmp).length <= 0) continue;

                                obj[key][j] = tmp;
                            }

                            if(obj[key].length === 0) delete obj[key];
                            else if(obj[key].length === 1) obj[key] = obj[key][0];
                        }
                    }
                }

                if(!!this.e[i].children)
                {
                    childHandler = getHandler(null, this.e[i].children);
                    obj = Object.assign(childHandler.export(type, ignore), obj);
                }


                if(Object.keys(obj).length <= 0) continue;

                if(exportObj[this.e[i].selector])
                {
                    if(!(typeof exportObj[this.e[i].selector] === "object" && "length" in exportObj[this.e[i].selector]))
                        exportObj[this.e[i].selector] = [exportObj[this.e[i].selector]];

                    exportObj[this.e[i].selector].push(obj);
                }
                else exportObj[this.e[i].selector] = obj;

                ignore.push(this.e[i]);
            }

            var sortExpObj = {};

            if(!!exportObj['@charset'])
                sortExpObj['@charset'] = exportObj['@charset'];

            if(!!exportObj['@import'])
                sortExpObj['@import'] = exportObj['@import'];

            if(!!exportObj['@namespace'])
                sortExpObj['@namespace'] = exportObj['@namespace'];

            if(!!exportObj['@font-face'])
                sortExpObj['@font-face'] = exportObj['@font-face'];

            tmp = Object.keys(sortExpObj).length > 0;

            if(tmp) for(i in exportObj) if(!sortExpObj[i])
                sortExpObj[i] = exportObj[i];

            if(_type === cssc.export.type.normal || _type === cssc.export.type.min)
                return helperCssTextFromObj(tmp ? sortExpObj : exportObj, null, _type);

            return tmp ? sortExpObj : exportObj;
        };
        handler.pos = function(p)
        {
            return ruleHandler(this.e[p] ? [this.e[p]] : []);
        };
        handler.first = function()
        {
            return this.pos(0);
        };
        handler.last = function()
        {
            return this.pos(this.e.length-1);
        };


        return handler;
    },
    cssc = function(sel, hasProp)
    {
        try
        {
            return handleSelection(sel, hasProp);
        }
        catch (err)
        {
            if(cssc.conf.viewErr) console.log(err);
            cssc.messages.push(err);
        }
    };
    cssc.import = function(importObj)
    {
        return handleImport(importObj);
    };
    cssc.export = function(type)
    {
        return handleSelection().export(type);
    };
    cssc.update = function(sel)
    {
        return handleSelection(sel).update()
    };
    cssc.init = function(toInit)
    {
        return initElements(toInit);
    };
    cssc.type = {
        'rule':       1, //check
        'charset':    2, //check
        'import':     3, //check
        'media':      4, //check
        'fontFace':   5, //check
        'page':       6, //check
        'keyframes':  7, //check
        'keyframe':   8, //check

        'namespace':      10, //check
        'counterStyle':   11, 
        'supports':       12, //check

        'fontFeatureValues': 14,
        'viewport':          15,

        names: {
            1:  "rule",
            2:  "charset",
            3:  "import",
            4:  "media",
            5:  "font-face",
            6:  "page",
            7:  "keyframes",
            8:  "keyframe",

            10: "namespace",
            11: "counter-style",
            12: "supports",

            14: "font-feature-values",
            15: "viewport"
        }
    };
    cssc.events = {
        'beforeChange':   "beforechange",
        'change':         "change",
        'beforeSet':      "beforeset",
        'set':            "set",
        'beforeCreate':   "beforecreate",
        'create':         "create",
        'beforeDelete':   "beforedelete",
        'delete':         "delete",
        'beforeDestroy':  "beforedestroy",
        'destroy':        "destroy"
    };
    cssc.export.type = {
         // Text output
        'normal':  'css',
        'min':     'minCss',

         // Object output
        'obj':          'obj',
        'object':       'object',
        'notMDObject':  'objNMDO' //not MultiDimensional Object
    };
    cssc.conf = {
        'styleId': "cssc-style",
        'viewErr': true
    };
    cssc.messages = [];
    cssc.vars = {};

    return cssc;
})();
