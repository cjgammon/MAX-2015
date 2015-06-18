/*global define $ requestAnimationFrame*/

define(function (require) {
	
	var App,
		Backbone = require('backbone'), 
		//BgView = require('app/views/bg-view'),
		MaskView = require('app/views/mask-view'),
		NotesView = require('pres/views/notes-view'),
		SlideBasicView = require('app/views/slide-basic-view'),
		SequenceView = require('app/views/sequence-view'),
		InOutView = require('app/views/inout-view'),
		VideoView = require('app/views/video-view'),
		IframeView = require('app/views/iframe-view'),
		IframeFullView = require('app/views/iframe-full-view'),
        AppBase = require('pres/views/app-base');

    App = AppBase.extend({
		BASE_VIEW: SlideBasicView,
		
		SLIDEVIEW_LIST: [],
	
        initialize: function () {
            if (this.passTest() !== true) {
				return;
			}

            AppBase.prototype.initialize.call(this);

            this.notesView = new NotesView();

			//this.bg = new BgView();
			this.render();
        },

		passTest: function () {	
			if (Modernizr.flexbox !== true) {
				return false;
			} else if (Modernizr.touch === true) {
				$('video').each(function () {
					$(this).attr({
						'src': $(this).data('src')
					});
				});
				return false;
			} else {
				return true;
			}
        },

        render: function () {
            AppBase.prototype.render.call(this);

	        //if (this.bg) {
			    //this.bg.render();
            //}
        }
    });

	return new App();
});
