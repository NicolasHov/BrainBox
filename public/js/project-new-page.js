!function(n){var e={};function t(c){if(e[c])return e[c].exports;var a=e[c]={i:c,l:!1,exports:{}};return n[c].call(a.exports,a,a.exports,t),a.l=!0,a.exports}t.m=n,t.c=e,t.d=function(n,e,c){t.o(n,e)||Object.defineProperty(n,e,{enumerable:!0,get:c})},t.r=function(n){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(n,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(n,"__esModule",{value:!0})},t.t=function(n,e){if(1&e&&(n=t(n)),8&e)return n;if(4&e&&"object"==typeof n&&n&&n.__esModule)return n;var c=Object.create(null);if(t.r(c),Object.defineProperty(c,"default",{enumerable:!0,value:n}),2&e&&"string"!=typeof n)for(var a in n)t.d(c,a,function(e){return n[e]}.bind(null,a));return c},t.n=function(n){var e=n&&n.__esModule?function(){return n.default}:function(){return n};return t.d(e,"a",e),e},t.o=function(n,e){return Object.prototype.hasOwnProperty.call(n,e)},t.p="",t(t.s=7)}({7:function(module,exports){eval('var host = "ws://" + window.location.hostname + ":8080/";\nif (window.WebSocket) {\n    ws=new WebSocket(host);\n} else if (window.MozWebSocket) {\n    ws=new MozWebSocket(host);\n}\nws.onopen = function(msg) {\n    ws.send(JSON.stringify({"type":"autocompleteClient"}));\n}\nws.onmessage = function(message) {\n    message = JSON.parse(message.data);\n    if (message.type === "projectNameQuery") {\n        if(message.metadata) {\n            $("#warning").html("The project <a><strong>"+message.metadata.shortname+"</strong></a> already exists");\n            $("#warning a").attr(\'href\',\'/project/\'+message.metadata.shortname);\n            $("#warning").show();\n            $("#createProject").css({\'pointer-events\':\'none\',opacity:0.5});\n        } else {\n            $("#warning").hide();\n            $("#createProject").css({\'pointer-events\':\'auto\',opacity:1});\n        }\n    }\n}\n\n$("#projectName").on(\'keyup\',function(e) {\n    var name=DOMPurify.sanitize($("#projectName").val());\n    \n    // check if name is alphanumeric\n    if(/[^a-zA-Z0-9]+/.test(name) === true) {\n        $("#warning").html("The name <strong>"+name+"</strong> is not allowed. Project short names can only contain letters and numbers");\n        $("#warning").show();\n        $("#createProject").css({\'pointer-events\':\'none\',opacity:0.5});\n    } else {\n    // check if name already exists\n        ws.send(JSON.stringify({"type":"projectNameQuery", "metadata":{"name":name}}));\n    }\n});\n\n$("#createProject").click(function cancelChanges(){location.pathname=\'/project/\'+$("#projectName").val()+\'/settings\'});\n$("#cancelChanges").click(function cancelChanges(){location.pathname=\'{{{projectURL}}}\'});\n\n$("#addProject").click(function(){location="/project/new"});\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi92aWV3L2JyYWluYm94L3NyYy9wYWdlcy9wcm9qZWN0LW5ldy1wYWdlLmpzPzMxMGUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBLDRCQUE0Qiw0QkFBNEI7QUFDeEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFDQUFxQyxvQ0FBb0M7QUFDekUsU0FBUztBQUNUO0FBQ0EscUNBQXFDLGtDQUFrQztBQUN2RTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlDQUFpQyxvQ0FBb0M7QUFDckUsS0FBSztBQUNMO0FBQ0EsZ0NBQWdDLHVDQUF1QyxhQUFhO0FBQ3BGO0FBQ0EsQ0FBQzs7QUFFRCxtREFBbUQsa0VBQWtFO0FBQ3JILG1EQUFtRCxzQkFBc0IsYUFBYSxFQUFFOztBQUV4RixrQ0FBa0Msd0JBQXdCIiwiZmlsZSI6IjcuanMiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgaG9zdCA9IFwid3M6Ly9cIiArIHdpbmRvdy5sb2NhdGlvbi5ob3N0bmFtZSArIFwiOjgwODAvXCI7XG5pZiAod2luZG93LldlYlNvY2tldCkge1xuICAgIHdzPW5ldyBXZWJTb2NrZXQoaG9zdCk7XG59IGVsc2UgaWYgKHdpbmRvdy5Nb3pXZWJTb2NrZXQpIHtcbiAgICB3cz1uZXcgTW96V2ViU29ja2V0KGhvc3QpO1xufVxud3Mub25vcGVuID0gZnVuY3Rpb24obXNnKSB7XG4gICAgd3Muc2VuZChKU09OLnN0cmluZ2lmeSh7XCJ0eXBlXCI6XCJhdXRvY29tcGxldGVDbGllbnRcIn0pKTtcbn1cbndzLm9ubWVzc2FnZSA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICBtZXNzYWdlID0gSlNPTi5wYXJzZShtZXNzYWdlLmRhdGEpO1xuICAgIGlmIChtZXNzYWdlLnR5cGUgPT09IFwicHJvamVjdE5hbWVRdWVyeVwiKSB7XG4gICAgICAgIGlmKG1lc3NhZ2UubWV0YWRhdGEpIHtcbiAgICAgICAgICAgICQoXCIjd2FybmluZ1wiKS5odG1sKFwiVGhlIHByb2plY3QgPGE+PHN0cm9uZz5cIittZXNzYWdlLm1ldGFkYXRhLnNob3J0bmFtZStcIjwvc3Ryb25nPjwvYT4gYWxyZWFkeSBleGlzdHNcIik7XG4gICAgICAgICAgICAkKFwiI3dhcm5pbmcgYVwiKS5hdHRyKCdocmVmJywnL3Byb2plY3QvJyttZXNzYWdlLm1ldGFkYXRhLnNob3J0bmFtZSk7XG4gICAgICAgICAgICAkKFwiI3dhcm5pbmdcIikuc2hvdygpO1xuICAgICAgICAgICAgJChcIiNjcmVhdGVQcm9qZWN0XCIpLmNzcyh7J3BvaW50ZXItZXZlbnRzJzonbm9uZScsb3BhY2l0eTowLjV9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICQoXCIjd2FybmluZ1wiKS5oaWRlKCk7XG4gICAgICAgICAgICAkKFwiI2NyZWF0ZVByb2plY3RcIikuY3NzKHsncG9pbnRlci1ldmVudHMnOidhdXRvJyxvcGFjaXR5OjF9KTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuJChcIiNwcm9qZWN0TmFtZVwiKS5vbigna2V5dXAnLGZ1bmN0aW9uKGUpIHtcbiAgICB2YXIgbmFtZT1ET01QdXJpZnkuc2FuaXRpemUoJChcIiNwcm9qZWN0TmFtZVwiKS52YWwoKSk7XG4gICAgXG4gICAgLy8gY2hlY2sgaWYgbmFtZSBpcyBhbHBoYW51bWVyaWNcbiAgICBpZigvW15hLXpBLVowLTldKy8udGVzdChuYW1lKSA9PT0gdHJ1ZSkge1xuICAgICAgICAkKFwiI3dhcm5pbmdcIikuaHRtbChcIlRoZSBuYW1lIDxzdHJvbmc+XCIrbmFtZStcIjwvc3Ryb25nPiBpcyBub3QgYWxsb3dlZC4gUHJvamVjdCBzaG9ydCBuYW1lcyBjYW4gb25seSBjb250YWluIGxldHRlcnMgYW5kIG51bWJlcnNcIik7XG4gICAgICAgICQoXCIjd2FybmluZ1wiKS5zaG93KCk7XG4gICAgICAgICQoXCIjY3JlYXRlUHJvamVjdFwiKS5jc3Moeydwb2ludGVyLWV2ZW50cyc6J25vbmUnLG9wYWNpdHk6MC41fSk7XG4gICAgfSBlbHNlIHtcbiAgICAvLyBjaGVjayBpZiBuYW1lIGFscmVhZHkgZXhpc3RzXG4gICAgICAgIHdzLnNlbmQoSlNPTi5zdHJpbmdpZnkoe1widHlwZVwiOlwicHJvamVjdE5hbWVRdWVyeVwiLCBcIm1ldGFkYXRhXCI6e1wibmFtZVwiOm5hbWV9fSkpO1xuICAgIH1cbn0pO1xuXG4kKFwiI2NyZWF0ZVByb2plY3RcIikuY2xpY2soZnVuY3Rpb24gY2FuY2VsQ2hhbmdlcygpe2xvY2F0aW9uLnBhdGhuYW1lPScvcHJvamVjdC8nKyQoXCIjcHJvamVjdE5hbWVcIikudmFsKCkrJy9zZXR0aW5ncyd9KTtcbiQoXCIjY2FuY2VsQ2hhbmdlc1wiKS5jbGljayhmdW5jdGlvbiBjYW5jZWxDaGFuZ2VzKCl7bG9jYXRpb24ucGF0aG5hbWU9J3t7e3Byb2plY3RVUkx9fX0nfSk7XG5cbiQoXCIjYWRkUHJvamVjdFwiKS5jbGljayhmdW5jdGlvbigpe2xvY2F0aW9uPVwiL3Byb2plY3QvbmV3XCJ9KTtcbiJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///7\n')}});