var tl;
function onLoad() {
  // setup layout 
  var theme = Timeline.ClassicTheme.create();
  //theme.autoWidth = true; // Set the Timeline's "width" automatically. Set autoWidth on the Timeline's first band's theme, will affect all bands.
  // wenn aktiviert bleibt bg weg und warnung wegen height attribut von ff
  theme.timeline_start = new Date(Date.UTC(2004, 0, 1));
  theme.timeline_stop  = new Date(Date.UTC(2018, 0, 1));
  theme.event.bubble.width = 320; 
  theme.event.bubble.maxHeight = 220; // vorher theme.event.bubble.height ohne scrollbar
  theme.event.tape.height = 4; // balkenh�he
  theme.event.track.height = theme.event.tape.height + 6; 
  //theme.event.instant.icon = Timeline.urlPrefix+"images/gray-circle.png";
  theme.ether.highlightOpacity = 35; 
  
  // define start date			
  var d = Timeline.DateTime.parseGregorianDateTime("May 24 2007")

Timeline.GregorianDateLabeller.prototype.labelPrecise = function(date) {
    return Timeline.DateTime.removeTimeZoneOffset(
            date, 
            this._timeZone //+ (new Date().getTimezoneOffset() / 60)
    ).toLocaleString(); // Use toLocaleString() instead of toLocaleFormat()
};
  
  // initialize timeline with two bands
  var eventSource = new Timeline.DefaultEventSource();
  var bandInfos = [
    Timeline.createBandInfo({   // .createHotZoneBandInfo({
          //zones: [
		  //  {   start:    "Jul 01 2008",
          //      end:      "Mar 01 2009",
          //      magnify:  1,
          //      unit:     Timeline.DateTime.MONTH
          //  }
        //],
		//set browser's timezone
        eventSource:    eventSource,
        date:           d,
        width:          "86%", 
        intervalUnit:   Timeline.DateTime.MONTH, 
        intervalPixels: 90,
		theme:          theme
    }),
    Timeline.createBandInfo({
        trackHeight:    0.5,
        trackGap:       0.2,
        eventSource:    eventSource,
        date:           d,
        width:          "14%", 
        intervalUnit:   Timeline.DateTime.YEAR, 
        intervalPixels: 150,
        overview:   	true,
		theme:          theme
    })
  ];
  // synchronize bands
  bandInfos[1].syncWith = 0;
  bandInfos[1].highlight = true;
 
  // label higlighted period in bottom band
  bandInfos[1].decorators = [
                new Timeline.SpanHighlightDecorator({
                    startDate:  "May 24 2007",
                    endDate:    "Dec 17 2008",
                    startLabel: "Release",
                    endLabel:   "Invasions",
                    color:      "gold",
                    opacity:    35,
                    theme:      theme
                }),
				new Timeline.SpanHighlightDecorator({
                    startDate:  "Dec 17 2008",
                    endDate:    "Feb 21 2011",
                    startLabel: "",
                    endLabel:   "Warmasters",
                    color:      "lightgreen",
                    opacity:    35,
                    theme:      theme
                }),
				new Timeline.SpanHighlightDecorator({
                    startDate:  "Feb 21 2011",
                    endDate:    "Dec 21 2012",
                    startLabel: "",
                    endLabel:   "Champions",
                    color:      "lightblue",
                    opacity:    35,
                    theme:      theme
                }),
				new Timeline.SpanHighlightDecorator({
                    startDate:  "Dec 21 2012",
                    endDate:    Date(),
                    startLabel: "",
                    endLabel:   "",//"heute",
                    color:      "darkorange",
                    opacity:    35,
                    theme:      theme
                })
            ];
  // label higlighted event in upper band			
  bandInfos[0].decorators = [		
				new Timeline.PointHighlightDecorator({
                	date:       "May 24 2007",
					color:      "gold",					
                    opacity:    35,
                    theme:      theme
              	}),
				new Timeline.PointHighlightDecorator({
                	date:       "Dec 17 2008",
                    color:      "lightgreen",
					opacity:    35,
                    theme:      theme
              	}),
				new Timeline.PointHighlightDecorator({
                	date:       "Feb 21 2011",
					color:      "lightblue",
                    opacity:    35,
                    theme:      theme
              	}),
				new Timeline.PointHighlightDecorator({
                	date:       "Dec 21 2012",
					color:      "darkorange",
                    opacity:    35,
                    theme:      theme
              	})
			];
	
	
  // data sources
  tl = Timeline.create(document.getElementById("regnumtl"), bandInfos, Timeline.HORIZONTAL);
  tl.loadJSON("/api/v1/timeline/events?"+ (new Date().getTime()), function(json, url) {
                eventSource.loadJSON(json, url);
				document.getElementById("regnum-event-count").innerHTML = eventSource.getCount();
            });
}

function sendEditRequestToParent(id) {
    window.parent.postMessage(id);
    console.log("Sent edit request for event with id " + id);
}

// focus band on year
var day = new Date().getDay();
var month = new Date().getMonth();
var year = new Date().getFullYear();
function centerTimeline(year,month,day) {
            tl.getBand(0).setCenterVisibleDate(new Date(year,month,day-31));
        }
		
//override bubble layout
var default_fillInfo = Timeline.DefaultEventSource.Event.prototype.fillInfoBubble;
Timeline.DefaultEventSource.Event.prototype.fillInfoBubble = function (elmt, theme, labeller) {
		var doc = elmt.ownerDocument;
        
        var title = this.getText();
        var link = this.getLink();
        var image = this.getImage();
        
        if (image != null) {
            var img = doc.createElement("img");
            img.src = image;
            
            theme.event.bubble.imageStyler(img);
            elmt.appendChild(img);
        }
        
        var divTitle = doc.createElement("div");
        var textTitle = doc.createTextNode(title);
        if (link != null) {
            var a = doc.createElement("a");
            a.href = link;
			//change bubble textlink target here
			a.target = "_new";
            a.appendChild(textTitle);
            divTitle.appendChild(a);
        } else {
            divTitle.appendChild(textTitle);
        }
        theme.event.bubble.titleStyler(divTitle);
        elmt.appendChild(divTitle);
        
        var divBody = doc.createElement("div");
        this.fillDescription(divBody);
        theme.event.bubble.bodyStyler(divBody);
        elmt.appendChild(divBody);
        
        var divTime = doc.createElement("div");
        this.fillTime(divTime, labeller);
        theme.event.bubble.timeStyler(divTime);
        elmt.appendChild(divTime);
        
        var divWiki = doc.createElement("div");
        this.fillWikiInfo(divWiki);
        theme.event.bubble.wikiStyler(divWiki);
        elmt.appendChild(divWiki);

        // button to call sendEditRequestToParant() with event id
        var divEdit = doc.createElement("div");
        var editButton = doc.createElement("button");
        editButton.innerHTML = "Edit";
        editButton.getID = this.getID().replace('e', '');
        editButton.onclick = function() {
            sendEditRequestToParent(this.getID);
        };
        divEdit.appendChild(editButton);
        elmt.appendChild(divEdit);
};


// this is directly from the Timeline tutorial		
var resizeTimerID = null;
function onResize() {
    if (resizeTimerID == null) {
        resizeTimerID = window.setTimeout(function() {
            resizeTimerID = null;
            tl.layout();
        }, 1500);
    }
}
