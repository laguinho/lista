////////////////////////////////////////////////////////////////////////////////////////////////////
// ui / loadbar ////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
// UI.loadbar.show()
// UI.loadbar.hide()

UI.loadbar = (function() {
	$(function() {
		$ui["loadbar"] = $(".ui-loadbar");
	});

	return {
		show: function() {
			$ui["loadbar"].addClass("in");
		},
		hide: function() {
			timing["hide-loadbar"] = setTimeout(function() {
				$ui["loadbar"]
					.removeClass("fade-in")
					.one("transitionend", function() {
						$ui["loadbar"].removeClass("in");
					});
			}, 800);
		}
	};
})();
