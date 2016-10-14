

// GoogleMap object
var Map = function (element, opts) {
    this.gMap = new google.maps.Map(element, opts);
    this.zoom = function (level) {
        if (level) {
            this.gMap.setZoom(level);
        } else {
            return this.gMap.getZoom();
        }
    };
};

// Options for map, zoom and lat & lng
var mapOptions = {
    center: {
    	lat:  51.507351, lng: -0.127758
    },
    zoom: 13,
    mapTypeId: google.maps.MapTypeId.ROADMAP
};

var element = document.getElementById('map-canvas'),
    iconSelected = './images/gMapPin.png';
var map = new Map(element, mapOptions);
map.zoom(15);

// Create a tab for information
var infoBubble = new InfoBubble({
    maxWidth: 300
});

// Text for each tab
infoBubble.addTab('Wikipedia','No content');
infoBubble.addTab('Street View','No content');

// Model
var places = [
     { id:  1, name: 'Downing Street 10' ,map: map.gMap, position: {lat: 51.503364, lng: -0.127625 }, icon: null, animation: google.maps.Animation.DROP, selected: 0 }
    ,{ id:  2, name: 'Buckinghamn Palace' ,map: map.gMap, position: { lat: 51.501364, lng: -0.14189}, icon: null, animation: 
    google.maps.Animation.DROP, selected: 0 }
	 ,{ id: 3, name: 'Picadilly Circus' ,map: map.gMap, position: { lat: 51.510097, lng: -0.134573}, icon: null, animation: 
    google.maps.Animation.DROP, selected: 0 }
	 ,{ id: 4, name: 'Oxford Street' ,map: map.gMap, position: {lat: 51.515358, lng: -0.141266}, icon: null, animation: 
    google.maps.Animation.DROP, selected: 0 }	
	 ,{ id: 5, name: 'The Sherlock Holmes Museum' ,map: map.gMap, position: {lat: 51.5237562, lng: -0.1585354000000052}, icon: null, animation: google.maps.Animation.DROP, selected: 0 }
];

// Creat markers
var Place = function(place) {
    place.name = ko.observable(place.name);
    place.selected = ko.observable(place.selected);
    var marker = new google.maps.Marker(place);
    if (map.markerCluster) {
        map.markerCluster.addMarker(marker);
    }
    return marker;
};


// ViewModel
var ViewModel = function(){
    var self = this;
    self.list = ko.observableArray([]);

   
    places.forEach(function(place){
        var marker = new Place(place);
      
        google.maps.event.addListener(marker, 'click', (function(Copy) {
            return function() {
                self.setCurrentPlace(Copy);
            };
        })(marker));
        self.list().push(marker);
    });
    // Ajax call to Wikipedia
    self.wikiCall = function(data){
        var wikiTimeOut = setTimeout(function(){
            infoBubble.updateTab(0, '<div class="infoBubble">Wikipedia</div>', "Request to Wikipedia failed");
            infoBubble.updateContent_();
        }, 8000);
        $.ajax({
            url: "http://en.wikipedia.org/w/api.php?action=opensearch&format=json&callback=wikiCallback&limit=10&search="+data.name(),
            type: 'POST',
            dataType: "jsonp",
            success: function( response ) {
                var articleTitle = response[1];
                var articleLink = response[3];
                var result = [];
                for (var i = 0; i < articleTitle.length; i++){
                    var title = articleTitle[i];
                    var link = articleLink[i];
                    result.push('<li><a href="'+link+'"target="_blank">'+title+'</a></li>');
                }
                var contentString = result.join('');
                clearTimeout(wikiTimeOut);
                infoBubble.updateTab(0,'<div class="infoBubble">Wikipedia</div>',contentString);
                infoBubble.updateContent_();
            }
        });
    };
    // Google Map Street View
    self.streetView = function(data){
        var img = data.position.A + "," + data.position.F;
        var contentString = '<img class="bgimg" alt="Image failed to load." src="https://maps.googleapis.com/maps/api/streetview?size=600x300&location='+img+'">';
        infoBubble.updateTab(1,'<div class="infoBubble">Street View</div>',contentString);
        infoBubble.updateContent_();
    };
    // Set out pin on selected city 
    self.setCurrentPlace = function(data){
        self.list().forEach(function(data){
            data.setIcon(null);
            data.selected(null);
        });
        data.setIcon(iconSelected);
        data.selected(1);
        self.currentPlace(data);
        self.wikiCall(data);
        self.streetView(data);
        infoBubble.open(map.gMap, data);
        return true;
    };
    self.currentPlace = ko.observable( this.list()[0] );
    self.searchBox = ko.observable("");
    self.searchPlaces = ko.computed(function() {
            if(self.searchBox() === "") {
                return self.list();
            } else {
                return ko.utils.arrayFilter(self.list(), function(item) {
                    return item.name().toLowerCase().indexOf(self.searchBox().toLowerCase())>-1;
                });
            }
        });
};
ko.applyBindings(new ViewModel());
