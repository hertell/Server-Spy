/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Server Spy code.
 *
 * The Initial Developer of the Server Spy is
 * Christophe Jacquet.
 *
 * Portions created by the Initial Developer are Copyright (C) 2006-2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either of the GNU General Public License Version 2 or later (the "GPL"),
 * or the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

 

var ServerSpy = {
	bundle: null,
	serverCache: null,
	prefManager: null,
	serverLast: "",
	
	serverIcons: {
		"Apache" : "A",
		"gws" : "G",	// Google search engine
		"GFE" : "G",	// Google
		"GSE" : "G",	// GMail
		"mfe" : "G",	// Google Maps
		"ucfe" : "G",	// Google Analytics
		"codesite" : "G",	// Google Code
		"pfe" : "G",	// Google Co-Op
		"SFE" : "G",	// Google Finance
		"cffe" : "G",	// Google Froogle
		"lighttpd" : "L",
		"nginx" : "n",
		"Microsoft-IIS" : "I"
	},

	start: function() {
		var oHeaderInfo;

		oHeaderInfo = {
			observe: this.HIObserve,
			QueryInterface: this.HIQueryInterface
		}

		this.addToListener(oHeaderInfo);

		// listen to tab switches
		// do not add the listeners right away, but wait for the browser
		// window to be fully loaded
		window.addEventListener(
			"load",
			function () {
				gBrowser.addEventListener("load", ServerSpy.update, true);
				gBrowser.addEventListener("select", ServerSpy.update, false);
			},
			false);
	
		// initialize serverspy's variables

		this.serverCache = new Array();
	
		// get the string bundle
		var src = "chrome://serverspy/locale/ui.properties";
		this.bundle = this.fetchStringBundle(src);
	
		this.prefManager = Components.classes["@mozilla.org/preferences-service;1"]
			.getService(Components.interfaces.nsIPrefBranch);
	
		this.prefManager.QueryInterface(Ci.nsIPrefBranch2); 
		this.prefManager.addObserver("extensions.ServerSpy@jacquet.eu.org.showIcon", {
			observe : function() {
				ServerSpy.update();
			}
		}, false);
		
		this.prefManager.addObserver("extensions.ServerSpy@jacquet.eu.org.showInBar", {
			observe : function() {
				ServerSpy.update();
			}
		}, false);
		
		this.prefManager.QueryInterface(Ci.nsIPrefBranch); 
	},

	fetchStringBundle : function(src) {
		var localeService = 
			Components.classes["@mozilla.org/intl/nslocaleservice;1"]
			.getService(Components.interfaces.nsILocaleService);
		var appLocale = localeService.getApplicationLocale();
		var stringBundleService = 
			Components.classes["@mozilla.org/intl/stringbundle;1"]
			.getService(Components.interfaces.nsIStringBundleService);
		return stringBundleService.createBundle(src, appLocale);
	},

	addToListener: function(obj) {
		var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
	    observerService.addObserver(obj, "http-on-examine-response", false);
	},


	// HeaderInfo implements nsIObserver
	//HeaderInfo: function() {
	//	this.observe = HIObserve;
	//	this.QueryInterface = HIQueryInterface;
	//},


	HIObserve: function(aSubject, aTopic, aData) {
	    if (aTopic == 'http-on-examine-response') {
			try {
				aSubject.QueryInterface(Components.interfaces.nsIHttpChannel);
				var url = aSubject.URI.asciiSpec;

				var sv = aSubject.getResponseHeader("Server");

				ServerSpy.serverCache[url] = sv;

				update();
			} catch(e) {
			}
    	}

	},

    
	HIQueryInterface: function(iid) {
	    if (!iid.equals(Components.interfaces.nsISupports) &&
    	    !iid.equals(Components.interfaces.nsIHttpNotify) &&
        	!iid.equals(Components.interfaces.nsIHttpNotify) &&
	        !iid.equals(Components.interfaces.nsIObserver)) {
    	      throw Components.results.NS_ERROR_NO_INTERFACE;
		}
		return this;
	},


	update: function() {
		var docurl = _content.document.URL;

		var sv = ServerSpy.serverCache[docurl];
		var sb = sv;
		if(!sv) sv = ServerSpy.bundle.GetStringFromName("unknown");
		if(!sb) sb = "(" + sv + ")";

		var svlabel = document.getElementById("serverspy_svlabel");
		var sblabel = document.getElementById("serverspy_sblabel");

		svlabel.value = ServerSpy.bundle.GetStringFromName("server.software") + " " + sv;
		
		sblabel.label = sb.split(" ", 1)[0];
		sblabel.setAttribute("tooltiptext", sb);
		
		ServerSpy.serverLast = sb;

	    var svicon = document.getElementById("serverspy_svicon");
    
    	svicon.hidden = ! ServerSpy.prefManager.getBoolPref("extensions.ServerSpy@jacquet.eu.org.showIcon");
    	
    	sblabel.hidden = !ServerSpy.prefManager.getBoolPref("extensions.ServerSpy@jacquet.eu.org.showInBar");
    	
    
	    var icon = "";
	    for(var name in ServerSpy.serverIcons) {
    		if(sv.substring(0, name.length) == name) icon = ServerSpy.serverIcons[name];
	    }
    	if(icon == "") icon = "unknown";
    
		svicon.setAttribute("src", "chrome://serverspy/content/" + icon + ".png");
	},

}


/*
    toJavaScriptConsole();

    // Dump a message to Javascript Console
    function d(msg){
       var acs = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
       acs.logStringMessage(msg);
    }
*/  

ServerSpy.start();


function serverspy_about() {
	window.openDialog("chrome://serverspy/content/about.xul",

		ServerSpy.bundle.GetStringFromName("appname"),
		"chrome,modal=no,dialog,resizable=no,titlebar,centerscreen", window);
}