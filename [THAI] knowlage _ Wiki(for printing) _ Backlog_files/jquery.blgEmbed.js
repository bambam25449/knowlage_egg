var Backlog = Backlog || {};
Backlog.jquery = Backlog.jquery || {};
Backlog.jquery.blgEmbed = {};

(function ($) {
	$.fn.blgEmbed = function (opts) {
		var opts = $.extend([], opts);
		return this.each( function() {

			$(this).find("a").each( function() {
				const $a = $(this);
				// テキスト整形ルール #image などリンク対象に画像がある場合は除外
				if ($a.find("img").length > 0) {
					return;
				}
				const href = $a.attr("href");
				if (href === undefined) {
					return;
				}
				const hasNulabAccount = Backlog && Backlog.resource && Backlog.resource['loginUser.hasNulabAccount'];
				if (hasNulabAccount) {
					// begin local integration-demo app
					if (location.hostname.match(/^\w+\.localhost$/)) {
						if (href.match(/http[:][/][/]localhost[:]8000/)) {
							demoGatewayEmbed($a, href);
						}
					}
				}
				// end local integration-demo app
				if($.inArray("cacoo", opts) !== -1 ) {
					if(href.match(/https[:][/][/](?:dev[.])?cacoo[.]com[/]diagrams[/][a-zA-Z0-9]+-[a-zA-Z0-9]+[.]png/)) {
						if (hasNulabAccount) {
							cacooPngGatewayEmbed($a, href);
						} else {
							cacooPngEmbed($a, href);
						}
					} else if(href.match(/https[:][/][/](?:dev[.])?cacoo\.com\/diagrams\/[A-Za-z0-9]+($|#|\/|\?).*$/)) {
						if (hasNulabAccount) {
							cacooGatewayEmbed($a, href);
						} else {
							cacooEmbed($a, href);
						}
					}
				}
				if($.inArray("typetalk", opts) != -1 ) {
					// IE9 以前は typetalk を埋め込まない
					var doTypetalkEmbed = true;
					if (window.navigator.appName == "Microsoft Internet Explorer") {
						if (document.documentMode) {
							if (document.documentMode < 10) {
								doTypetalkEmbed = false;
							}
						} else {
							doTypetalkEmbed = false;
						}
					}
					if (doTypetalkEmbed) {
						var foundTypetalkPost = href.match(/https[:][/][/]((?:dev[.])?typetalk[.](?:in|com))[/]topics[/]([0-9]+)[/]posts[/]([0-9]+)/);
						if (foundTypetalkPost) {
							var host = foundTypetalkPost[1];
							var topicId = foundTypetalkPost[2];
							var postId = foundTypetalkPost[3];
							if (hasNulabAccount) {
								typetalkPostGatewayEmbed(this, host, topicId, postId);
							} else {
								typetalkPostEmbed(this, host, topicId, postId);
							}
						} else {
							var foundTypetalkTalk = href.match(/https[:][/][/]((?:dev[.])?typetalk[.](?:in|com))[/]topics[/]([0-9]+)[/]talks[/]([0-9]+)/);
							if (foundTypetalkTalk) {
								var host = foundTypetalkTalk[1];
								var topicId = foundTypetalkTalk[2];
								var talkId = foundTypetalkTalk[3];
								if (hasNulabAccount) {
									typetalkTalkGatewayEmbed(this, host, topicId, talkId);
								} else {
									typetalkTalkEmbed(this, host, topicId, talkId);
								}
							}
						}
					}
				}
				if($.inArray("video", opts) !== -1 ) {
					// IE8 以前は youtube を埋め込まない
					var doYoutubeEmbed = true;
					if (window.navigator.appName == "Microsoft Internet Explorer") {
						if (document.documentMode) {
							if (document.documentMode < 9) {
								doYoutubeEmbed = false;
							}
						} else {
							doYoutubeEmbed = false;
						}
					}

					var youtubeInfo;
					if (doYoutubeEmbed) {
						youtubeInfo = findYoutubeInfo(href);
					}
					if (youtubeInfo) {
						youtubeEmbed($a, youtubeInfo);
					} else if(href.match(/https?[:][/][/]vimeo[.]com[/][0-9]+/)) {
						vimeoEmbed($a, href);
					}
				}

				// IE7 以前は twitter を埋め込まない
				var doTwitterEmbed = true;
				if (window.navigator.appName == "Microsoft Internet Explorer") {
					if (document.documentMode) {
						if (document.documentMode < 8) {
							doTwitterEmbed = false;
						}
					} else {
						doTwitterEmbed = false;
					}
				}
				if (doTwitterEmbed) {
					if($.inArray("twitter", opts) !== -1 ) {
						if (href.match(/https?[:][/][/]twitter[.]com([/]#!)?[/](\w+)[/](status|statuses)[/](\d+)/)) {
							twitterEmbed($(this), href);
						}
					}
				}
			});
		});
	};

	var findYoutubeInfo = function (href) {
		if (!href.match(/https?[:][/][/]www[.]youtube[.]com[/]/)
				&& !href.match(/https?[:][/][/]youtu[.]be[/]/)) {
			return undefined;
		}
		var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
		var match = href.match(regExp);
		if (match&&match[2].length == 11) {
			return {
				url: href,
				id: match[2]
			};
		}
		return undefined;
	};
	Backlog.jquery.blgEmbed.findYoutubeInfo = findYoutubeInfo;

	/**
	 * local integration-demo app
	 */
	function demoGatewayEmbed(elem, href) {
		const m = href.match(/http[:][/][/]localhost:8000[/](.*)/);
		if (m) {
			const path = m[1];
			elem.addClass('js-embeded').after(
				$("<iframe>")
					.attr({
						src: "/nulab-integration/integration.nulab.com/" + path,
						width: "402",
						height: "330",
						frameborder: "0",
						scrolling: "no",
						margin: "3px 0"
					})
					.css({display: "block"})
			)
		}
	}

	/*******************************************************************
	 * 
	 * cacoo埋め込み
	 * 
	 ******************************************************************/
	function cacooPngGatewayEmbed(hover, href) {
		const j$img = $("<img/>")
			.attr({ src: href.replace(/^https[:][/][/](dev[.])?/, '/nulab-integration/') })
			.css({
				"max-width": 400,
				"max-height": 300,
				border: "1px solid #ccc",
				margin: "3px 0",
				display: "block",
				clear: "both"
			});
		hover.after(j$img);
		hover.addClass("js_embeded");
	}

	function cacooPngEmbed(hover, href) {
		const j$img = $("<img/>")
			.attr({ src: href })
			.css({ 
				"max-width": 400, 
				"max-height": 300, 
				border: "1px solid #ccc",
				margin: "3px 0",
				display: "block",
				clear: "both"
			});
		hover.after(j$img);
		hover.addClass("js_embeded");
	}

	function cacooGatewayEmbed(hover, href) {
		hover.after(
			$("<iframe>")
				.attr({ src: "/nulab-integration/cacoo.com/viewer/redirect?w=400&h=300&url=" + encodeURIComponent(href),
					width: "402",
					height: "330",
					frameborder: "0",
					scrolling: "no",
					margin: "3px 0"
				})
				.css({ display: "block" })
		);
		hover.addClass("js_embeded");
	}
	
	function cacooEmbed(hover, href) {
		const host = new URL(href).host;
		hover.after(
			$("<iframe>")
				.attr({ src: "https://" + host + "/viewer/redirect?w=400&h=300&url=" + encodeURIComponent(href),
					width: "402",
					height: "330",
					frameborder: "0",
					scrolling: "no",
					margin: "3px 0"
				})
				.css({ display: "block" })
		);
		hover.addClass("js_embeded");
	}
	
	function getActualDimension(image) {
		 var run, mem, w, h;
		 run = image.runtimeStyle;
		 mem = {
			 w : run.width,
			 h : run.height
		 }; // keep runtimeStyle
		 run.width = "auto"; // override
		 run.height = "auto";
		 w = image.width;
		 h = image.height;
		 run.width = mem.w; // restore
		 run.height = mem.h;
		 return {
			 width : w,
			 height : h
		 };
	 }

	/*******************************************************************
	 * 
	 * typetalk 埋め込み
	 * 
	 ******************************************************************/
	function typetalkPostGatewayEmbed(hover, host, topicId, postId) {
		var element = document.createElement("script");
		element.src = "https://" + host + "/embed/widgets.js";
		element.setAttribute("data-typetalk-topic-id", topicId);
		element.setAttribute("data-typetalk-post-id", postId);
		element.setAttribute("data-typetalk-use-3rd-party-cookie", false);
		element.setAttribute("async", true);
		hover.parentNode.insertBefore(element, hover.nextSibling);
	}

	function typetalkPostEmbed(hover, host, topicId, postId) {
		var element = document.createElement("script");
		element.src = "https://" + host + "/embed/widgets.js";
		element.setAttribute("data-typetalk-topic-id", topicId);
		element.setAttribute("data-typetalk-post-id", postId);
		element.setAttribute("data-typetalk-use-3rd-party-cookie", true);
		element.setAttribute("async", true);
		hover.parentNode.insertBefore(element, hover.nextSibling);
	}

	function typetalkTalkGatewayEmbed(hover, host, topicId, talkId) {
		var element = document.createElement("script");
		element.src = "https://" + host + "/embed/widgets.js";
		element.setAttribute("data-typetalk-topic-id", topicId);
		element.setAttribute("data-typetalk-talk-id", talkId);
		element.setAttribute("data-typetalk-use-3rd-party-cookie", false);
		element.setAttribute("async", true);
		hover.parentNode.insertBefore(element, hover.nextSibling);
	}

	function typetalkTalkEmbed(hover, host, topicId, talkId) {
		var element = document.createElement("script");
		element.src = "https://" + host + "/embed/widgets.js";
		element.setAttribute("data-typetalk-topic-id", topicId);
		element.setAttribute("data-typetalk-talk-id", talkId);
		element.setAttribute("data-typetalk-use-3rd-party-cookie", true);
		element.setAttribute("async", true);
		hover.parentNode.insertBefore(element, hover.nextSibling);
	}

	/*******************************************************************
	 * 
	 * 動画埋め込み
	 * 
	 ******************************************************************/
    var VIDEO_DEFAULT_WIDTH = 400;
	function youtubeEmbed(hover, info) {
		var vidId = info.id;
		var ratio = 80.5;
		hover.after(
			$("<iframe/>")
				.attr({
					width: VIDEO_DEFAULT_WIDTH,
					height: Math.ceil((VIDEO_DEFAULT_WIDTH*ratio)/100),
					src: "https://www.youtube-nocookie.com/embed/" + vidId,
					frameborder: 0,
					scrolling: "no"
				})
				.css({ display: "block" })
		);
		hover.addClass("js_embeded");
	}
	function vimeoEmbed(hover, href) {
		var vidId = (href.match(/\d+/))[0];
		var ratio = 75.0;
		hover.after(
			$("<iframe/>")
				.attr({
					width: VIDEO_DEFAULT_WIDTH,
					height: Math.ceil((VIDEO_DEFAULT_WIDTH*ratio)/100),
					src: "https://player.vimeo.com/video/" + vidId + "?portrait=0",
					frameborder: 0,
					scrolling: "no"
				})
				.css({ display: "block" })
		);
		hover.addClass("js_embeded");
	}
	
	/*******************************************************************
	 * 
	 * twitter埋め込み
	 * 
	 ******************************************************************/
	var TWITTER_IFRAME_URL = Backlog.getAssetPath("/twitter/twitterOembed.html");
	var twitterUniqueId=0;
	function twitterEmbed(hover, href) {
		var found = href.match(/(?:status|statuses)\/(\d+)/)
		if (!found) {
			return;
		}
		var id = found[1];
		if(twitterUniqueId === 0){
			addSizeMessageEvent();
		}
		twitterUniqueId++;
		var iframe = $("<iframe/>")
			.attr({
				src: TWITTER_IFRAME_URL + "?id=" + id+"&unique="+twitterUniqueId,
				frameborder: 0,
				scrolling: "no",
				id: "twitter-iframe-"+twitterUniqueId,
				marginheight: 0,
				marginwidth: 0,
				allowtransparency: "true"
			})
			.css({ display: "block", width: "100%", height: "0", maxWidth: "100%", minWidth: "240px"});
		var loading = $("<div />")
			.attr({id: "twitter-loading-"+twitterUniqueId})
			.css({
				width:"40px",
				padding:"25px 10px 10px 25px",
				background:"url('"+Backlog.getAssetPath("/shared/img/loading.gif")+"') 50% 50% no-repeat #fff",
				border: "1px solid #ccc",
				borderRadius: "5px",
				zIndex: "30",
				margin: "20px"
			});
		hover.after(loading).after(iframe);
		hover.addClass("js_embeded");
	}
	function addSizeMessageEvent() {
		$(window).on('message',function(e){
			receiveSize(e.originalEvent); // 元のイベント取り出して渡す
		});
	}
	function receiveSize(e) {
		if (!(typeof (e.data) == "string" || e.data instanceof String)) return;
		var remoteDomain = e.origin.split('/')[2];
		if(remoteDomain === TWITTER_IFRAME_URL.split('/')[2] || 
			remoteDomain === location.hostname ||
			remoteDomain === location.hostname+":"+location.port) { // ドメインチェック
			var height=0, unique=0;
			$.each(e.data.split(','), function (index, item) {
				var param = item.split(':');
				if(param[0] === "height") {
					height = param[1];
				} else if(param[0] === "unique") {
					unique = param[1];
				}
			});
			if(unique!==0 && height!==0){
				var iframe = $("#twitter-iframe-"+unique);
				var loading = $("#twitter-loading-"+unique);
				if (loading.length > 0){
					loading.remove();
					iframe.css("opacity","0");
					iframe.height(height);
					iframe.animate({opacity:"1"}, 400);
				}else{
					iframe.height(height);
				}
			}
		}
	}
})(jQuery);