////////////////////////////////////////////////////////////////////////////////////////////////////
// login ///////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
var $login;

var login = (function() {
	return {
		show: function() {
		//	backdrop.show();
			$login.addClass("in").reflow().addClass("slide");
			$ui["body"].addClass("no-scroll");
			setTimeout(function() { $("input[name='email']", $login).focus(); }, 300);
		},
		hide: function() {
			$ui["body"].removeClass("no-scroll");
			$login.removeClass("slide").one("transitionend", function() {
				$login.removeClass("in");
			});
		//	backdrop.hide();
		}
	};
})();

$(function() {
	$login = $("#login");
	$(".js-login-trigger", $ui["sidenav"]).on("click", function(event) {
		event.preventDefault();
		sidenav.close();
		login.show();
	});
	$login.on("click", ".back", function(event) {
		event.preventDefault();
		login.hide();
	}).on("submit", "form", function(event) {
		event.preventDefault();

		$.getJSON("https://api.laguinho.org/lista/" + edicao + "/auth?key=" + api_key + "&callback=?", $("form", $login).serialize()).done(function(response) {
			if(response["meta"]["status"] === 200) {
				user = response["user"];
				user["signed-in"] = true;
				localStorage.setItem("user", JSON.stringify(user));

				$ui["body"].addClass("signed-in user-" + user["turma"]);
				login.hide();
				setTimeout(function() {
					UI.toast.show("Olá " + user["name"] + "!");
				}, 500);
			} else {
				$(".form-group", $login).addClass("animated shake");
				setTimeout(function() { $(".form-group", $login).removeClass("animated shake"); }, 1000);
			}
		});
	});

	$(".js-logout-trigger", $ui["sidenav"]).on("click", function(event) {
		event.preventDefault();
		$ui["body"].removeClass("signed-in user-" + user["turma"]);

		user = {
			"id": null,
			"name": null,
			"email": null,
			"token": null,
			"turma": null,
			"signed-in": false
		};
		localStorage.setItem("user", JSON.stringify(user));

		sidenav.close();
		setTimeout(function() {
			UI.toast.show("Sessão encerrada!");
		}, 500);
	});
});

////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

var user = {
	"id": null,
	"name": null,
	"email": null,
	"token": null,
	"turma": null,
	"signed-in": false
};

if (localStorage && localStorage.getItem("user")) {
	user = JSON.parse(localStorage.getItem("user"));

	$(function() {
		if (user["id"] !== null) {
			$ui["body"].addClass("signed-in user-" + user["turma"]);
			setTimeout(function() {
				UI.toast.show("Olá " + user["name"] + "!");
			}, 3000);
		}
	});
}
