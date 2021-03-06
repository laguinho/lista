////////////////////////////////////////////////////////////////////////////////////////////////////
// lista de tarefas ////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

// Todas as informações ficam guardadas dentro do objeto "Lista",
// em um dos seus 4 nós
let Lista = [ ];
Lista.Edicao = { };
Lista.Placar = [ ];
Lista.Tarefas = [ ];
Lista.Usuario = { };

// "app" guarda os métodos específicos do funcionamento da Lista,
// "$app" guarda as referências jQuery ao DOM usadas nesses métodos
let app = [ ];
let $app = [ ];

let cache = [ ];
cache["tarefas"] = [ ];

////////////////////////////////////////////////////////////////////////////////////////////////////

let cue = [ ];
let worker = [ ];
let timing = [ ];

// Se o logging estiver ligado, relata cada passo no console
// Obs: nem todos os métodos estão com logs criados ou detalhados!
let logging = false;
let log = function(message, type) {
	if (logging) {
		// Insere a hora no log
		let timestamp = moment().format("LTS");
		message = "[" + timestamp + "] " + message;

		if (!type) {
			console.log(message);
		} else {
			console[type](message);
		}
	}
}

let analytics = function(category, action, label) {
	if (typeof ga !== "undefined") {
		ga("send", "event", category, action, label);
	}
};

////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

// daqui pra baixo não é pra ter nada!!

var tarefa_active;

////////////////////////////////////////////////////////////////////////////////////////////////////
// utilities ///////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

// rand
const rand = (min, max) => {
	return Math.random() * (max - min) + min;
};

////////////////////////////////////////////////////////////////////////////////////////////////////
// template engine /////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

let $templates = { };

$(function() {
	// Pega os templates do HTML,
	// guarda em $templates
	// e remove eles do código-fonte
	$("template").each(function() {
		let $this = $(this);
		let name = $this.attr("id");
		let html = $this.html();

		$templates[name] = $(html);
		$this.remove();
	});
});

function __render(template, data) {
	// Se template não existir, aborta
	if (!$templates[template]) {
		return false;
	}

	var $render = $templates[template].clone();

	$render.data(data);

	$.fn.fillBlanks = function() {
		var $blank = $(this);
		var fill = $blank.data("fill");

		var rules = fill.split(",");
		for (var i = 0; i < rules.length; i++) {
			var pair = rules[i].split(":");
			var dest = (pair[1]? pair[0].trim() : "html");
			var source = (pair[1]? pair[1].trim() : pair[0]);
			var value = data[source];

			// TODO
			// source = source.split("/");
			// if (source.length > 1) {
			// 	// value = data[source[0]];
			// 	// console.log(source, source, value);
			// 	// if (typeof value !== "undefined") {
			// 		for (var j = 0; j <= source.length; j++) {
			// 			console.log(value, source, data[source[0]]);
			// 			if (value && value[source] && source[j] && value[source[j]]) {
			// 				value = (value[source[j]])? value[source[j]] : null;
			// 			} else {
			// 				value = null;
			// 			}
			// 		}
			// 	// }
			// }

			if (typeof value !== "undefined" && value !== null) {
				if (dest === "class") {
					$blank.addClass(value);
				} else if (dest === "html") {
					$blank.html(value);
				} else if (dest === "value") {
					$blank.val(value);
				} else {
					$blank.attr(dest, value);
				}
			} else {
				var if_null = $blank.data("fill-null");
				if (if_null === "hide") {
					$blank.hide();
				} else if(if_null === "remove") {
					$blank.remove();
				}
			}
		}

		$blank
			.removeClass("fill")
			.removeAttr("data-fill")
			.removeAttr("data-fill-null");
	};

	if ($render.hasClass("fill")) {
		$render.fillBlanks();
	}

	$(".fill", $render).each(function() {
		$(this).fillBlanks();
	});

	return $render;
}

////////////////////////////////////////////////////////////////////////////////////////////////////
// router //////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
var router = [ ];

////////////////////////////////////////////////////////////////////////////////////////////////////
// navigation mode
router["path"] = location.pathname.split("/");

if (router["path"][1] === "tarefas") {
	router["navigation-mode"] = "path";
} else {
	router["navigation-mode"] = "hash";
	router["path"] = location.hash.split("/");
}

////////////////////////////////////////////////////////////////////////////////////////////////////
// go
router["go"] = function(path, object, title) {
	if (router["navigation-mode"] === "path") {
		history.pushState(object, title, path);
	} else {
		history.pushState(object, title, "#" + path);
		// location.hash = path;
	}
};

////////////////////////////////////////////////////////////////////////////////////////////////////
// build link
router["build-link"] = function(path) {
	var link;
	if (router["navigation-mode"] === "path") {
		link = path;
	} else {
		link = "#" + path;
	}

	return link;
};

////////////////////////////////////////////////////////////////////////////////////////////////////
// view manager
router["current-view"] = ["home"];
router["view-manager"] = (function() {
	return {
		add: function(view) {
			router["current-view"].push(view);
			// console.log(router["current-view"]);
		},
		remove: function(view) {
			router["current-view"] = $.grep(router["current-view"], function(value) {
				return value !== view;
			});
			// console.log(router["current-view"]);
		},
		replace: function(view) {
			router["current-view"] = [ ];
			router["view-manager"].add(view);
		}
	};
})();

////////////////////////////////////////////////////////////////////////////////////////////////////

window.addEventListener("popstate", function(event) {
	// console.log("location: " + document.location + ", state: " + JSON.stringify(event.state));

	var state = event.state;

	if (state && state["view"] === "tarefa") {
		if (router["current-view"].indexOf("bottomsheet") > -1) { UI.bottomsheet.close(); }
		if (router["current-view"].indexOf("new-post") > -1) { app.Post.close(); }
		app.Tarefa.open(state["id"]);
	}

	else if (state && state["view"] === "new-post") {
		// app.Post.open(state["type"], state["id"]);
	}

	else if (state && state["view"] === "bottomsheet") {
		if (router["current-view"].indexOf("new-post") > -1) { app.Post.close(); }
	}

//	if (state["view"] === "home") {
	else {
		if (router["current-view"].indexOf("bottomsheet") > -1) { UI.bottomsheet.close(); }
		if (router["current-view"].indexOf("new-post") > -1) { app.Post.close(); }
		app.Tarefa.close();
	}

});

////////////////////////////////////////////////////////////////////////////////////////////////////
// states:
// * tarefa
// * home
// * new-post
// * bottomsheet

////////////////////////////////////////////////////////////////////////////////////////////////////
// ui //////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
let UI = { }
UI.data = [ ];

let $ui = [ ];
$ui["window"] = $(window);
$ui["body"] = $(document.body);

// Pega o título da página ("Lista de Tarefas")
// e guarda pra quando for necessário recuperar
$ui["page-title"] = $("head title");
UI.data["page-title"] = $ui["page-title"].text();

// $ui["window"]
// $ui["title"]
// $ui["body"]
// $ui["appbar"]
// $ui["loadbar"]
// $ui["sidenav"]
// $ui["bottomsheet"]
// $ui["toast"]
// $ui["backdrop"]
// $ui["footer"]
// $ui["page-title"]

// Dados definidos:
// UI.data["column-width"]

// Dados consultáveis:
// UI.data["window"]["width"]
// UI.data["window"]["height"]
// UI.data["scroll-position"]["top"]
// UI.data["scroll-position"]["bottom"]
// UI.data["columns"]
// UI.data["interaction-type"]
// UI.data["theme-color"]["original"]
// UI.data["title"]
// UI.data["scrollbar-size"]


////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

// Função para forçar reflow
$.fn.reflow = function() {
	let offset = $ui["body"].offset().left;
	return $(this);
};

////////////////////////////////////////////////////////////////////////////////////////////////////
// ui / utilities //////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

// Título e cor do tema
UI.data["theme-color"] = [ ];

$(function() {
	$ui["title"] = $("head title");
	UI.data["title"] = $ui["title"].html();

	$ui["theme-color"] = $("meta[name='theme-color']");
	UI.data["theme-color"]["original"] = $ui["theme-color"].attr("content");
});

// Tipo de interação (touch ou pointer)
UI.data["interaction-type"] = ("ontouchstart" in window || navigator.msMaxTouchPoints)? "touch" : "pointer";


////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

// Propriedades da janela e do layout
UI.data["column-width"] = 316; // Largura da coluna, incluindo margem
UI.data["window"] = [ ];

function setLayoutProperties() {
	// Dimensões (largura e altura) da janela
	UI.data["window"]["width"] = $ui["window"].width();
	UI.data["window"]["height"] = $ui["window"].height();

	// Calcula número de colunas
	UI.data["columns"] = Math.floor(UI.data["window"]["width"] / UI.data["column-width"]);

	// Adiciona classe no <body> de acordo com a quantidade de colunas
	let layout_class;
	if (UI.data["columns"] === 1) {
		layout_class = "ui-single-column";
	} else if (UI.data["columns"] === 2) {
		layout_class = "ui-dual-column";
	} else {
		layout_class = "ui-multi-column";
	}

	$ui["body"].removeClass("ui-single-column ui-dual-column ui-multi-column").addClass(layout_class);
}

function getScrollbarSize() {
	// Descobre o tamanho da barra de rolagem
	let $outerContainer = $("<div />").css({
		"overflow": "scroll",
		"display": "none"
	}).appendTo($ui["body"]);
	let $innerContainer = $("<div />").appendTo($outerContainer);

	UI.data["scrollbar-size"] = $outerContainer.width() - $innerContainer.width();
	$outerContainer.remove();
}

// As propriedades da janela e do layout são calculadas
// quando a página é carregada e quando a janela é redimensionada.
// O tamanho da barra de rolagem é calculado somente quando a página é carregada
$(function() { setLayoutProperties(); getScrollbarSize(); });
$ui["window"].on("resize", setLayoutProperties);


////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

// Propriedades (posição no topo e no fim da janela) do scroll
UI.data["scroll-position"] = [ ];

function setScrollPosition() {
	UI.data["scroll-position"]["top"] = $ui["window"].scrollTop();
	UI.data["scroll-position"]["bottom"] = UI.data["scroll-position"]["top"] + UI.data["window"]["height"];
}

// As propriedades do scroll são calculadas quando a página é carregada
// e quando a janela é redimensionada ou "scrollada"
$(function() { setScrollPosition(); });
$ui["window"].on("scroll resize", setScrollPosition);

////////////////////////////////////////////////////////////////////////////////////////////////////
// ui / body ///////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
// UI.body.lock()
// UI.body.unlock()

UI.body = (function() {
	$(function() {
		// ui["body"] é definido no document.js
		$ui["body"].addClass("ui-" + UI.data["interaction-type"]);
		scrollStatus();
	});

	$ui["window"].on("scroll", scrollStatus);

	function scrollStatus() {
		var y = $(window).scrollTop();

		if (y > 1) {
			$ui["body"].removeClass("scroll-top");
		} else {
			$ui["body"].addClass("scroll-top");
		}

		if (y > 56) {
			$ui["body"].addClass("livesite-blur").removeClass("livesite-focus");
		} else {
			$ui["body"].addClass("livesite-focus").removeClass("livesite-blur");
		}
	}

	return {
		////////////////////////////////////////////////////////////////////////////////////////////
		// UI.body.lock()
		lock: function() {
			$ui["body"].addClass("no-scroll").css("margin-right", UI.data["scrollbar-size"]);
		},

		////////////////////////////////////////////////////////////////////////////////////////////
		// UI.body.unlock()
		unlock: function() {
			$ui["body"].removeClass("no-scroll").css("margin-right", 0);
		}
	};
})();

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

////////////////////////////////////////////////////////////////////////////////////////////////////
// ui / backdrop ///////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
// UI.backdrop.show()
// UI.backdrop.hide()

UI.backdrop = (function() {
	$ui["backdrop"] = [ ];

	$(function() {
		// $ui["backdrop"] = $(".js-ui-backdrop");
		// $ui["backdrop"].on("click", function() {
		// 	$ui["backdrop"].trigger("hide");
		// });
	});

	return {
		show: function($screen, events) {
			var screen = $screen["selector"];
			var zindex = $screen.css("z-index") - 1;

			$ui["backdrop"][screen] = __render("backdrop");

			$.each(events, function(event, handler) {
				$ui["backdrop"][screen].on(event, handler)
			});

			$ui["backdrop"][screen].css("z-index", zindex)
				.on("click", function() { $(this).trigger("hide"); })
				.appendTo($ui["body"])
				.addClass("in");
		},
		hide: function($screen) {
			var screen = $screen["selector"];
			$ui["backdrop"][screen].removeClass("in").off("hide").remove();
		}
	};
})();

////////////////////////////////////////////////////////////////////////////////////////////////////
// ui sidenav //////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

UI.sidenav = (function() {
	$(function() {
		$ui["sidenav"] = $(".js-ui-sidenav");

		$(".js-sidenav-trigger").on("click", function(event) {
			event.preventDefault();
			UI.sidenav.open();
		});
	});

	return {
		open: function() {
			UI.body.lock();
			UI.backdrop.show($ui["sidenav"], { "hide": UI.sidenav.close });
			$ui["sidenav"].addClass("in");
		},
		close: function() {
			$ui["sidenav"].removeClass("in");
			UI.backdrop.hide($ui["sidenav"]);
			UI.body.unlock();
		}
	};
})();

////////////////////////////////////////////////////////////////////////////////////////////////////
// bottomsheet
UI.bottomsheet = (function() {
	return {
		open: function($content, addClass) {
			UI.backdrop.show($ui["bottomsheet"], { "hide": UI.bottomsheet.close });
			$ui["bottomsheet"].html($content).addClass((addClass? addClass + " " : "") + "in").reflow().addClass("slide");

			UI.data["theme-color"]["buffer"] = $ui["theme-color"].attr("content");
			$ui["theme-color"].attr("content", "#000");

			router["view-manager"].add("bottomsheet");
			history.pushState({ "view": "bottomsheet" }, null, null);
		},
		close: function() {
			$ui["bottomsheet"].removeClass("slide").one("transitionend", function() {
				$ui["bottomsheet"].removeClass("in").empty().attr("class", "ui-bottomsheet js-ui-bottomsheet");
			});

			$ui["theme-color"].attr("content", UI.data["theme-color"]["buffer"]);

			UI.backdrop.hide($ui["bottomsheet"]);

			router["view-manager"].remove("bottomsheet");
		}
	};
})();

$(function() {
	$ui["bottomsheet"] = $(".js-ui-bottomsheet");
});

////////////////////////////////////////////////////////////////////////////////////////////////////
// ui toast ////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

UI.toast = (function() {
	$ui["toast"] = [ ];

	$(function() {
		$ui["toast"] = $(".js-ui-toast");
		$ui["toast"]["message"] = $(".toast-message", $ui["toast"]);
		$ui["toast"]["label"] = $(".toast-label", $ui["toast"]);
	});

	return {
		// TODO nova sintaxe, usar template e __render
		show: function(config) {
			log("UI.toast.show");
			// Opções:
			// • "message" [string]
			// • "label" [string]
			// • "action" [function]
			// • "persistent" [boolean]
			// • "timeout" [integer] default: 6000
			// • "start-only" [boolean]

			if (typeof config === "object") {
				$ui["toast"].removeClass("start-only");

				// Texto do toast
				$ui["toast"]["message"].html(config["message"] || "");

				// Texto da ação
				// (Só mostra de texto e ação estiverem definidos)
				if (config["label"] && config["action"]) {
					$ui["toast"]["label"]
						.html(config["label"])
						.off("click")
						.on("click", config["action"])
						.show();
				} else {
					$ui["toast"]["label"]
						.hide();
				}

				$ui["toast"].addClass("in").reflow().addClass("slide");
				$ui["body"].addClass("toast-active");

				// TODO: .fab-bottom transform: translateY

				// Ao clicar no toast, fecha ele
				$ui["toast"].on("click", UI.toast.dismiss);
				clearTimeout(timing["toast"]);

				// Se não for persistente,
				// fecha depois de um tempo determinado
				if (!config["persistent"]) {
					timing["toast"] = setTimeout(UI.toast.dismiss, (config["timeout"]? config["timeout"] : 6000));
				}

				// Se for pra ser exibido só na tela inicial
				if (config["start-only"]) {
					$ui["toast"].addClass("start-only");
				}
			} else {
				UI.toast.show({
					"message": config
				})
			}
		},

		dismiss: function() {
			log("UI.toast.dismiss");
			$ui["toast"].removeClass("slide").one("transitionend", function() {
				$ui["body"].removeClass("toast-active");
				$ui["toast"].removeClass("in start-only");

				$ui["toast"]["message"].empty();
				$ui["toast"]["label"].empty();
			});
			clearTimeout(timing["toast"]);
		},

		// TODO DEPRECATED
		open: function(message, action, callback, persistent) {
		// open: function(message, addClass) {
			$ui["toast"].message.html(message);
			$ui["toast"].label.html((action? action : ""));
			$ui["toast"].addClass("in").reflow().addClass("slide");
			$ui["body"].addClass("toast-active");

			// TODO: .fab-bottom transform: translateY

			$ui["toast"].on("click", UI.toast.dismiss);
			$ui["toast"].label.on("click", callback);

			clearTimeout(timing["toast"]);

			if (!persistent) {
				$ui["toast"].removeClass("start-only");
				timing["toast-open"] = setTimeout(UI.toast.dismiss, 6500);
			} else {
				$ui["toast"].addClass("start-only");
			}
		}
	};
})();

// var toast = UI.toast;
// toast.close = UI.toast.dismiss;

// var snackbar = toast;

////////////////////////////////////////////////////////////////////////////////////////////////////
// api /////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

// TODO legacy (deve ficar só dentro da função abaixo)
let api_key = "063c72b2afc5333f3b27b366bdac9eb81d64bc6a12cd7b3f4b6ade77a092b63a";

const ListaAPI = (endpoint, data) => {
	log("API Request: " + endpoint, "info");
	let api_url = "https://api.laguinho.org/lista/" + edicao;
	let api_key = "063c72b2afc5333f3b27b366bdac9eb81d64bc6a12cd7b3f4b6ade77a092b63a";

	let request = $.getJSON(api_url + endpoint + "?key=" + api_key + "&callback=?", data);
	return request;
};

////////////////////////////////////////////////////////////////////////////////////////////////////
// app placar //////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

app.Placar = (function() {
	$(function() {
		$ui["placar"] = $(".js-app-placar ul");
	});

	return {
		start: function() {
			// TODO
		},

		update: function() {
			// Limpa o placar
			$ui["placar"].empty();

			// Confere qual a turma com maior pontuação
			// e soma a pontuação de cada turma para obter o total de pontos
			let maior_pontuacao = 0;
			let total_de_pontos = 0;

			Lista.Placar.forEach(function(turma) {
				let pontuacao_da_turma = turma["pontos"];

				if (pontuacao_da_turma > maior_pontuacao) {
					maior_pontuacao = pontuacao_da_turma;
				}

				total_de_pontos += pontuacao_da_turma;
			});

			// Com os dados básicos calculados,
			// adiciona as turmas no placar
			Lista.Placar.forEach(function(turma) {
				// Calcula % da turma
				// em relação à turma de maior pontuação
				let percentual_da_turma = (total_de_pontos > 0? turma["pontos"] / maior_pontuacao : 0);

				// Formata os dados para o placar
				turma["turma-formatada"] = turma["turma"].toUpperCase();
				turma["tamanho-da-barra"] = "height: " + (percentual_da_turma * 100).toFixed(3) + "%;";
				turma["pontuacao-formatada"] = turma["pontos"].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

				let $turma = __render("placar-turma", turma);
				$ui["placar"].append($turma);
			});

			if (total_de_pontos === 0) {
				$ui["placar"].addClass("placar-zerado");
			} else {
				$ui["placar"].removeClass("placar-zerado");
			}
		}
	}
})();

////////////////////////////////////////////////////////////////////////////////////////////////////
// app evolução ////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
// app.Evolucao.start()
// app.Evolucao.update()

// TODO
// - mostrar contador nas últimas 48 horas
// - o que acontece depois do encerramento?
//   barra fica da cor da turma e aparece mensagem em cima "EC1 campeã"

app.Evolucao = (function() {
	let duracao_total;

	$(function() {
		$ui["evolucao"] = $(".app-evolucao");
	});

	return {
		////////////////////////////////////////////////////////////////////////////////////////////
		// app.Evolucao.start()
		start: function() {
			log("app.Evolucao.start", "info");

			// Pega data de início e data de encerramento
			let dia_inicial = Lista.Edicao["inicio"] = moment(Lista.Edicao["inicio"]);
			let dia_final = Lista.Edicao["fim"] = moment(Lista.Edicao["fim"]);

			// Calcula o tempo total (em minutos)
			duracao_total = dia_final.diff(dia_inicial, "minutes");

			// Insere os dias na barra, indo de dia em dia até chegar ao encerramento
			for (let dia = dia_inicial.clone(); dia.isBefore(dia_final); dia.add(1, "days")) {
				// Define início e final do dia
				// Se final for após a data de encerramento, usa ela como final
				let inicio_do_dia = dia;
				let final_do_dia = dia.clone().endOf("day");
				if (final_do_dia.isAfter(dia_final)) {
					final_do_dia = dia_final;
				}

				// Calcula a duração do dia em minutos
				let duracao_do_dia = final_do_dia.diff(inicio_do_dia, "minutes");

				// Define a duração percentual do dia em relação ao total
				let percentual_do_dia = duracao_do_dia / duracao_total;

				// Calcula a largura do dia (de acordo com duração percentual)
				// e insere dia na barra de evolução
				let largura_do_dia = (percentual_do_dia * 100).toFixed(3);
				let $dia = __render("evolucao-dia", {
					dia: dia.format("ddd")
				}).css("width", largura_do_dia + "%");

				$(".day-labels", $ui["evolucao"]).append($dia);
			}

			// Com os dias inseridos na barra de evolução,
			// desenha a barra de tempo transcorrido
			setTimeout(app.Evolucao.update, 1000);

			// Atualiza a linha de evolução a cada X minutos
			timing["evolucao"] = setInterval(app.Evolucao.update, 60 * 1000);
		},

		////////////////////////////////////////////////////////////////////////////////////////////
		// app.Evolucao.update()
		update: function() {
			log("app.Evolucao.update", "info");

			// Pega as datas e calcula o tempo (em minutos) e percentual transcorridos
			let agora = moment();
			let dia_inicial = moment(Lista.Edicao["inicio"]);
			let dia_final = moment(Lista.Edicao["fim"]);

			let tempo_transcorrido = agora.diff(dia_inicial, "minutes");
			let percentual_transcorrido = (tempo_transcorrido < duracao_total ? tempo_transcorrido / duracao_total : 1);

			// Define a largura da barra de evolução completa igual à largura da tela
			// Depois, mostra apenas o percentual transcorrido
			$(".elapsed-time .bar", $ui["evolucao"]).css("width", UI.data["window"]["width"]);

			let largura_da_barra = (percentual_transcorrido * 100).toFixed(3);
			$(".elapsed-time", $ui["evolucao"]).css("width", largura_da_barra + "%");
		}
	}
})();

////////////////////////////////////////////////////////////////////////////////////////////////////
// lista ///////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
// app.Lista.load()
// app.Lista.layout()
// app.Lista.sort()

app.Lista = (function() {
	$(function() {
		$app["lista"] = $(".app-lista");

		$app["lista"].isotope({
			"itemSelector": ".card-tarefa",
			"transitionDuration": ".8s",
			"getSortData": {
				"date": function(element) {
					return $(element).data("last-modified");
				},
				"tarefa": function(element) {
					return parseInt($(element).data("tarefa"), 10);
				}
			},
			"sortAscending": {
				"date": false,
				"tarefa": true
			},
			"sortBy": ["date", "tarefa"],
			"masonry": {
				"gutter": (UI.data["columns"] === 1? 8 : 16)
			}
		});

		$app["lista"].on("click", ".card-tarefa:not(.fantasma)", function(event) {
			if (event.which === 1) {
				event.preventDefault();

				let $card = $(this);
				let numero = $card.data("tarefa");
				app.Tarefa.open(numero, $card, true);
			}
		});
	});

	return {
		////////////////////////////////////////////////////////////////////////////////////////////
		// app.Lista.start()
		start: function() {
			log("app.Lista.start", "info");

			// faz as alterações de acordo com o status
			// insere as mensagens
			app.Lista.tarefas();
			app.Lista.status();
			app.Lista.messages();

			// tira a tela de loading
			UI.loadbar.hide();
		},

		////////////////////////////////////////////////////////////////////////////////////////////
		// app.Lista.status()
		status: function() {
			// se prazo de postagem estiver encerrado, insere classe no <body>
			if (moment().isAfter(Lista.Edicao["fim"])) {
				$ui["body"].addClass("postagens-encerradas");
			}

			// se a edição estiver encerrada, insere classe no <body>
			// e para de atualizar automaticamente
			if (Lista.Edicao["encerrada"] === true) {
				$ui["body"].addClass("edicao-encerrada");
				clearInterval(timing["atividade"]);
			}
		},

		////////////////////////////////////////////////////////////////////////////////////////////
		// app.Lista.messages()
		messages: function() {
			// se tiver título especificado, insere ele
			if (Lista.Edicao["mensagem"]["titulo"]) {
				let page_title = Lista.Edicao["mensagem"]["titulo"];
				$ui["title"].html(page_title);
			}

			// de tiver mensagem de rodapé especificada, insere ela
			if (Lista.Edicao["mensagem"]["rodape"]) {
				let closing_message = Lista.Edicao["mensagem"]["rodape"];
				$(".js-mensagem-final").html(closing_message);
			}
		},

		////////////////////////////////////////////////////////////////////////////////////////////
		// app.Lista.tarefas()
		tarefas: function() {
			// mostra o loading e limpa a lista para começar do zero
			// UI.loading.show();
			$app["lista"].empty();

			// insere as tarefas
			for (let tarefa of Lista.Tarefas) {
				// Insere no cache
				cache["tarefas"][tarefa["numero"]] = tarefa;

				// Cria o link para a tarefa
				tarefa["url"] = router["build-link"]("/tarefas/" + tarefa["numero"]);

				// Se tiver imagem, ajusta as dimensoes
				if (tarefa["imagem"]) {
					tarefa["imagem/url"] = tarefa["imagem"]["url"];
					tarefa["imagem/aspecto"] = "padding-top: " + (tarefa["imagem"]["aspecto"] * 100).toFixed(2) + "%";
				}

				let $tarefa = __render("card-tarefa", tarefa).data({
					"tarefa": tarefa["numero"],
					"last-modified": (tarefa["ultima-postagem"]? moment(tarefa["ultima-postagem"]).format("X") : 0)
				});

				////////////////////////////////////////////////////////////////////////////////////
				// posts
				let $grid = $(".tarefa-conteudo .grid", $tarefa);

				if (tarefa["quantidade-de-posts"] && tarefa["posts"]) {
					// var total_media = tarefa["posts"].reduce((total, post) => total + post["midia"].length, 0);
					// var max_media_to_show = (UI.data["columns"] < 2? 9 : 8);
					var max_media_to_show = 8;
					var shown_media_count = 0;

					var post_types_with_image_preview = ["imagem", "youtube", "vimeo", "vine", "gif"];
					var post_types_with_text_preview = ["texto"];

					for (let i = 0; i < max_media_to_show; i++) {
						if (tarefa["posts"][i]) {
							let post = tarefa["posts"][i];

							if (post["midia"] || post["tipo"] == "texto") {
								shown_media_count++;

								var tile_type;
								var media = { };

								// imagem
								if (post_types_with_image_preview.indexOf(post["tipo"]) > -1) {
									tile_type = "tile-image";

									media["count"] = shown_media_count;

									if (post["tipo"] == "youtube" || post["tipo"] == "vimeo" || post["tipo"] == "vine" || post["tipo"] == "gif") {
										media["preview"] = "background-image: url('" + post["midia"][0]["thumbnail"] + "');";
										media["modifier"] = "video";
									} else if (post["midia"] && post["midia"][0]) {
										media["preview"] = "background-image: url('" + post["midia"][0]["caminho"] +
											post["midia"][0]["arquivos"][0] + "');";
									}
								} else

								// texto
								if (post_types_with_text_preview.indexOf(post["tipo"]) > -1) {
									tile_type = "tile-text";
									media = {
										"preview": post["legenda"].substring(0, 120),
										"count": shown_media_count
									};
								}

								if ((shown_media_count === max_media_to_show) && ((tarefa["quantidade-de-posts"] - shown_media_count) > 0)) {
									media["modifier"] = "more";
									media["more"] = "+&thinsp;" + (tarefa["quantidade-de-posts"] - shown_media_count + 1);
								}

								var $tile = __render(tile_type, media).appendTo($grid);
							}
						}
					}

				} else {
					// se não tiver nenhum post, remove o grid
					$(".tarefa-conteudo", $tarefa).remove();
				}

				// Se for preview
				if (tarefa["preview"]) {
					$tarefa.addClass("fantasma");
					$("a", $tarefa).removeAttr("href");
					$(".tarefa-corpo", $tarefa).remove();
				}

				$app["lista"].append($tarefa).isotope("appended", $tarefa);
			}

			app.Lista.layout();
			app.Lista.sort((Lista.Edicao["encerrada"]? "tarefa": "date"));
		},

		////////////////////////////////////////////////////////////////////////////////////////////
		// app.Lista.load()
		// load: function() {
		// 	// mostra a tela de loading e limpa o stream
		// 	$stream.loading.addClass("fade-in in");
		//
		// 	// carrega os dados da API
		// 	$.getJSON("https://api.laguinho.org/lista/" + edicao + "/tudo?key=" + api_key + "&callback=?").done(function(data) {
		// 		// "DIRETOR"
		// 		// TODO O load deve ficar separado do Stream (ver issue #7)
		// 		Lista.Regulamento = data["edicao"];
		// 		Lista.Tarefas = data["tarefas"];
		//
		// 		// Se a Edição estiver encerrada...
		//
		//
		// 		// FIM DO "DIRETOR"
		//
		// 		// Limpa o stream para começar do zero
		// 		$stream.empty();
		//
		// 		// Monta placar
		// 		app.Placar.update(data["placar"]);
		//
		// 		// Insere os cards de tarefas
		// 		$.each(data["tarefas"], function(index, tarefa) {
		// 			tarefas[tarefa["numero"]] = tarefa;
		// 			tarefa["url"] = "/tarefas/" + tarefa["numero"];
		// 			tarefa["url"] = router["build-link"]("/tarefas/" + tarefa["numero"]);
		//
		// 			if (tarefa["imagem"]) {
		// 				tarefa["imagem-url"] = tarefa["imagem"]["url"];
		// 				tarefa["imagem-aspecto"] = "padding-top: " + (tarefa["imagem"]["aspecto"] * 100).toFixed(2) + "%";
		// 			}
		//
		// 			var $card = __render("card-tarefa", tarefa).data({
		// 					"tarefa": tarefa["numero"],
		// 					"last-modified": (tarefa["ultima-postagem"]? moment(tarefa["ultima-postagem"]).format("X") : 0)
		// 				});
		//
		// 			if (tarefa["preview"]) {
		// 				$card.addClass("fantasma");
		// 				$("a", $card).removeAttr("href");
		// 				$(".body", $card).remove();
		// 			}
		//
		// 			if (!tarefa["imagem"]) {
		// 				$(".media", $card).remove();
		// 			}
		//
		// 			// posts
		// 			var $grid = $(".grid", $card);
		//
		// 			if (tarefa["quantidade-de-posts"] > 0 && tarefa["posts"]) {
		// 				// var total_media = tarefa["posts"].reduce((total, post) => total + post["midia"].length, 0);
		// 				var max_media_to_show = (UI.data["columns"] < 2? 9 : 8);
		// 				var shown_media_count = 0;
		//
		// 				var post_types_with_image_preview = ["imagem", "youtube", "vimeo", "vine", "gif"];
		// 				var post_types_with_text_preview = ["texto"];
		//
		// 				for (var i = 0; i < tarefa["quantidade-de-posts"]; i++) {
		// 					var post = tarefa["posts"][i];
		//
		// 					if ((post["midia"] || post["tipo"] == "texto") && (shown_media_count < max_media_to_show)) {
		// 						shown_media_count++;
		//
		// 						var tile_type;
		// 						var media = { };
		//
		// 						// imagem
		// 						if (post_types_with_image_preview.indexOf(post["tipo"]) > -1) {
		// 							tile_type = "tile-image";
		//
		// 							media["count"] = shown_media_count;
		//
		// 							if (post["tipo"] == "youtube" || post["tipo"] == "vimeo" || post["tipo"] == "vine" || post["tipo"] == "gif") {
		// 								media["preview"] = "background-image: url('" + post["midia"][0]["thumbnail"] + "');";
		// 								media["modifier"] = "video";
		// 							} else if (post["midia"] && post["midia"][0]) {
		// 								media["preview"] = "background-image: url('" + post["midia"][0]["caminho"] +
		// 									post["midia"][0]["arquivos"][0] + "');";
		// 							}
		// 						} else
		//
		// 						// texto
		// 						if (post_types_with_text_preview.indexOf(post["tipo"]) > -1) {
		// 							tile_type = "tile-text";
		// 							media = {
		// 								"preview": post["legenda"].substring(0, 120),
		// 								"count": shown_media_count
		// 							};
		// 						}
		//
		// 						if ((shown_media_count === max_media_to_show) && ((tarefa["quantidade-de-posts"] - shown_media_count) > 0)) {
		// 							media["modifier"] = "more";
		// 							media["more"] = "+&thinsp;" + (tarefa["quantidade-de-posts"] - shown_media_count + 1);
		// 						}
		//
		// 						var $tile = __render(tile_type, media).appendTo($grid);
		// 					}
		// 				}
		//
		// 			} else {
		// 				// se não tiver nenhum post, remove o grid
		// 				$grid.remove();
		// 			}
		//
		// 			// atualiza o isotope
		// 			$stream.append($card).isotope("appended", $card);
		// 		});
		//
		// 		// Se a Edição estiver encerrada, ordena por número da tarefa.
		// 		// Se não, ordena por ordem de atualização
		// 		app.Lista.layout();
		// 		app.Lista.sort((Lista.Edicao["encerrada"]? "tarefa": "date"));
		//
		// 		// se tiver tarefa especificada no load da página, carrega ela
		// 		if (router["path"][2]) {
		// 			app.Tarefa.open(router["path"][2]);
		// 		}
		//
		// 		// esconde a tela de loading
		// 		setTimeout(function() {
		// 			$stream.loading
		// 				.removeClass("fade-in")
		// 				.one("transitionend", function() { $stream.loading.removeClass("in");
		// 			});
		// 		}, 1200);
		//
		// 		// guarda a data da última atualização e zera o contador de novidades
		// 		last_updated = moment(data["edicao"]["ultima-atualizacao"]);
		// 		updated["tarefas"] = 0;
		// 		updated["posts"] = 0;
		// 	});
		// },

		////////////////////////////////////////////////////////////////////////////////////////////
		// app.Lista.layout()
		layout: function() {
			$app["lista"].isotope("reloadItems");
			$app["lista"].isotope("layout");
		},

		////////////////////////////////////////////////////////////////////////////////////////////
		// app.Lista.sort()
		sort: function(criteria) {
			$app["lista"].isotope({
				"sortBy": criteria
			});
		}
	};
})();

// jQuery
var $stream;

$(function() {
	$stream = $(".js-app-lista");
	// $stream.loading = $("main .loading");

	$stream.isotope({
		"itemSelector": ".card-tarefa",
		"transitionDuration": ".8s",
		"getSortData": {
			"date": ".last-modified",
			"tarefa": function(element) {
				return parseInt($(element).data("tarefa"), 10);
			}
		},
		"sortAscending": {
			"date": false,
			"tarefa": true
		},
		"sortBy": ["date", "tarefa"],
		"masonry": {
			"gutter": (UI.data["columns"] === 1? 8 : 16)
		}
	});

	// $stream.on("click", ".card-tarefa:not(.fantasma)", function(event) {
	// 	if (event.which === 1) {
	// 		event.preventDefault();
	//
	// 		var numero = $(this).data("tarefa");
	// 		app.Tarefa.open(numero, true);
	// 	}
	// });

	// app.Lista.load();

	// ordenação
	$ui["sidenav"].on("click", ".js-lista-sort a", function(event) {
		event.preventDefault();

		let criteria = $(this).data("sort-by");
		let title = $(this).find("span").text();
		$(".js-lista-sort a", $ui["sidenav"]).removeClass("active");
		$(this).addClass("active");

		app.Lista.sort(criteria);
		UI.sidenav.close();
		analytics("Lista", "Ordenação", title);
	});
});

////////////////////////////////////////////////////////////////////////////////////////////////////
// tarefa //////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
// app.Tarefa.open()
// app.Tarefa.render()
// app.Tarefa.close()

app.Tarefa = (function() {
	$(function() {
		$app["tarefa"] = $(".app-tarefa");

		// Botões de fechar a Tarefa e voltar à Lista
		$app["tarefa"].on("click", ".js-tarefa-close", function(event) {
			event.preventDefault();
			app.Tarefa.close(true);
		})

		// Botão de novo post
		.on("click", ".js-new-post-trigger", function() {
			UI.bottomsheet.open($(".new-post-sheet", $app["tarefa"]).clone().show());
		})

		// Desabilita clique no card da Tarefa
		.on("click", ".card-tarefa a", function(event) {
			if (event.which === 1) {
				event.preventDefault();
			}
		});
	});

	let placar_da_tarefa = [ ];

	function renderPosts(posts, $posts) {
		placar_da_tarefa["total"] = 0;
		for (var turma in Lista.Edicao["turmas"]) {
			placar_da_tarefa[Lista.Edicao["turmas"][turma]] = 0;
		}

		$.each(posts, function(index, post) {
			post["turma-background"] = post["turma"] + "-light-background";
			post["data-de-postagem-formatada"] = moment(post["data-de-postagem"]).calendar();
			post["turma-formatada"] = post["turma"].toUpperCase();

			// legenda
			if (post["legenda"] && post["legenda"].substring(0,3) !== "<p>") {
				post["legenda"] = "<p>" + post["legenda"].replace(/(?:\r\n\r\n|\r\r|\n\n)/g, "</p><p>") + "</p>";
			}

			// avaliação
			if (post["avaliacao"]) {
				post["avaliacao/mensagem"] = post["avaliacao"]["mensagem"];

				if (post["avaliacao"]["status"] === 200) {
					post["status-class"] = post["turma"];
					post["status-icon"] = "<i class=\"material-icons\">&#xE87D;</i>"; // coração
					post["avaliacao/status"] = post["avaliacao"]["pontos"] + " ponto" + (post["avaliacao"]["pontos"] > 1? "s": "");
					post["avaliacao/class"] = "turma-text";
				} else {
					post["status-class"] = "rejected";
					post["status-icon"] = "<i class=\"material-icons\">&#xE888;</i>";
					post["avaliacao/status"] = "Reprovado";
				}

				// soma pontos no placar
				placar_da_tarefa["total"] += post["avaliacao"]["pontos"];
				placar_da_tarefa[post["turma"]] += post["avaliacao"]["pontos"];
			} else {
				post["status-icon"] = "<i class=\"material-icons\">&#xE8B5;</i>"; // relógio
				post["avaliacao/status"] = "Aguardando avaliação";
			}

			// renderiza o post
			let $content_card = __render("content-card", post);
			let $media = $(".content-media > ul", $content_card);

			// adiciona mídias
			if (post["midia"]) {
				$.each(post["midia"], function(index, media) {
					// imagem
					if (post["tipo"] == "imagem") {
						media["default"] = media["caminho"] + media["arquivos"][1];
						media["padding-aspecto"] = "padding-top: " + (media["aspecto"] * 100).toFixed(2) + "%";
						media["link-original"] = media["caminho"] + media["arquivos"][2];
						var $image = __render("media-photo", media);
						$media.append($image);
					} else

					// embed
					if (post["tipo"] == "youtube" || post["tipo"] == "vimeo" || post["tipo"] == "vine") {
						if (post["tipo"] == "youtube") {
							media["embed"] = "https://www.youtube.com/embed/" + media["youtube-id"] + "?rel=0&amp;showinfo=0";
						} else

						if (post["tipo"] == "vimeo") {
							media["embed"] = "https://player.vimeo.com/video/" + media["vimeo-id"] + "?title=0&byline=0&portrait=0";
						} else

						if (post["tipo"] == "vine") {
							media["embed"] = "https://vine.co/v/" + media["vine-id"] + "/embed/simple";
						}

						media["padding-aspecto"] = "padding-top: " + (media["aspecto"] * 100).toFixed(2) + "%";
						var $embed = __render("media-video", media);
						$media.append($embed);
					}
				});
			}

			// tira legenda se não tiver
			if (!post["legenda"]) {
				$content_card.addClass("no-caption");
			}

			if (!post["midia"]) {
				$content_card.addClass("no-media");
			}

			// tira mensagem de avaliação se não tiver
			if (!post["avaliacao"] || !post["mensagem"]) {
				$(".result .message", $content_card).remove();
			}


			// adiciona o post à tarefa
			// $posts.append($content_card).isotope("appended", $content_card);
			$posts.append($content_card);
		});
	}

	return {
		data: { },

		////////////////////////////////////////////////////////////////////////////////////////////
		// app.Tarefa.open() ///////////////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////////////////////
		open: function(numero, $card, pushState) {
			// console.log($card[0].getBoundingClientRect());

			let tarefa = cache["tarefas"][numero];
			tarefa_active = numero;

			// if (UI.data["columns"] >= 3) {
			// 	// UI.backdrop.show($app["tarefa"], { "hide": app.Tarefa.close });
			// 	// $ui["backdrop"][$app["tarefa"]].on("hide", app.Tarefa.close);
			// }

			$app["tarefa"].addClass("in");
			app.Tarefa.render(tarefa);

			$app["tarefa"].reflow().addClass("slide-x").one("transitionend", function() {
				// var view_theme_color = $(".appbar", $app["tarefa"]).css("background-color");
				// $("head meta[name='theme-color']").attr("content", "#546e7a");
			});

			UI.body.lock();
			$ui["body"].addClass("tarefa-active");

			// router
			router["view-manager"].replace("tarefa");
			if (pushState) {
				router.go("/tarefas/" + tarefa["numero"], {
					"view": "tarefa",
					"id": tarefa["numero"]
				}, tarefa["titulo"]);
			}

			// analytics
			analytics("Tarefa", "Acesso", numero);
		},

		////////////////////////////////////////////////////////////////////////////////////////////
		// app.Tarefa.render() /////////////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////////////////////
		render: function(tarefa) {
			var $tarefa = __render("view-tarefa", tarefa);

			////////////////////////////////////////////////////////////////////////////////////////
			// card da tarefa
			if (tarefa["imagem"]) {
				tarefa["imagem"]["aspecto"] = "padding-top: " + (tarefa["imagem"]["aspecto"] * 100).toFixed(2) + "%";
			}

			var $tarefa_card = __render("card-tarefa", tarefa);

			if (!tarefa["imagem"]) {
				$(".media", $tarefa_card).remove();
			}
			$(".grid", $tarefa_card).remove();
			$("a", $tarefa_card).removeAttr("href");

			$(".tarefa-meta .tarefa-texto", $tarefa).append($tarefa_card);

			////////////////////////////////////////////////////////////////////////////////////////
			// content
			let $posts = $(".tarefa-content > ul", $tarefa);

			if (tarefa["posts"].length) {
				renderPosts(tarefa["posts"], $posts);

				$posts.isotope({
					"itemSelector": ".content-card",
					"transitionDuration": 0,
					"masonry": {
						"isFitWidth": true,
						"gutter": (UI.data["columns"] === 1? 8 : 24)
					}
				// }).on("layoutComplete", function(event, posts) {
				// 	var previous_position;
				//
				// 	for (var post in posts) {
				// 		var $this = $(posts[post].element);
				// 		var offset = posts[post].position;
				// 		var side = (offset["x"] === 0? "left" : "right");
				//
				// 		$this.addClass("timeline-" + side);
				//
				// 		if (offset["y"] - previous_position < 10) {
				// 			$this.addClass("extra-offset");
				// 		}
				//
				// 		previous_position = offset["y"];
				// 	}
				});

				setTimeout(function() {
					$posts.isotope("layout");
				}, 1);

			} else {
				$("<li />").addClass("empty").text("Nenhum post").appendTo($posts);
			}

			////////////////////////////////////////////////////////////////////////////////////////
			// layout
			$app["tarefa"].html($tarefa);

			if (tarefa["posts"].length) {
				$posts.isotope("layout");
			}

			// placar da tarefa
			// var $placar_da_tarefa = $(".painel .placar ul", $tarefa);
			//
			// $.each(Lista.Edicao["turmas"], function(index, turma) {
			// 	var pontuacao_da_turma = [ ];
			//
			// 	// calcula % da turma em relação ao total de pontos
			// 	var percentual_da_turma = (placar_da_tarefa["total"] > 0? placar_da_tarefa[turma] / placar_da_tarefa["total"] : 0);
			// 	pontuacao_da_turma["turma"] = turma;
			// 	pontuacao_da_turma["altura-da-barra"] = "height: " + (percentual_da_turma * 100).toFixed(3) + "%";
			// 	pontuacao_da_turma["turma-formatada"] = turma.toUpperCase();
			// 	pontuacao_da_turma["pontos"] = (placar_da_tarefa[turma] > 0? placar_da_tarefa[turma] : 0);
			// 	pontuacao_da_turma["pontuacao-formatada"] = pontuacao_da_turma["pontos"].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
			//
			// 	var $turma = __render("placar-turma", pontuacao_da_turma);
			// 	$placar_da_tarefa.append($turma);
			// });

			$(".tarefa-wrapper", $app["tarefa"]).on("scroll", app.Tarefa.observer);
		},


		////////////////////////////////////////////////////////////////////////////////////////////
		// app.Tarefa.close() //////////////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////////////////////
		close: function(pushState) {
			tarefa_active = null;
			$("head meta[name='theme-color']").attr("content", UI.data["theme-color"]["original"]);

			UI.body.unlock();
			$ui["body"].removeClass("tarefa-active");
			$app["tarefa"].removeClass("slide-x").one("transitionend", function() {
				$app["tarefa"].removeClass("in").empty();
			});

			if (UI.data["columns"] >= 3) {
				// UI.backdrop.hide($app["tarefa"]);
			}

			// router
			router["view-manager"].replace("home");
			if (pushState) { router.go("/tarefas", { "view": "home" }, "Lista de Tarefas"); }
		},


		////////////////////////////////////////////////////////////////////////////////////////////
		// app.Tarefa.observer() ///////////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////////////////////
		observer: function() {
			app.Tarefa.data["height"] = $(".tarefa-outer-container", $app["tarefa"]).outerHeight();
			app.Tarefa.data["scrollYpos"] = $(".tarefa-wrapper", $app["tarefa"]).scrollTop();

			console.log(app.Tarefa.data);
		}
	};
})();

////////////////////////////////////////////////////////////////////////////////////////////////////
// new post ////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
// * app.Post.authorize()
// * app.Post.deauthorize()
// * app.Post.getThumbnail()
// * app.Post.open()
// * app.Post.close()

// tipos de post: photo, video, text

app.Post = (function() {
	$(function() {
		$app["post"] = $(".app-post");
		$ui["bottomsheet"].on("click", ".new-post-sheet a", function(event) {
			event.preventDefault();

			var type = $(this).data("post-type");
			UI.bottomsheet.close();
			setTimeout(function() {
				app.Post.open(type, tarefa_active);
			}, 600);
		});

		$app["post"].on("submit", "form", function(event) {
			event.preventDefault();
		}).on("click", ".submit-button", function(event) {
			event.preventDefault();

			if (moment().isAfter(Lista.Edicao["fim"])) {
				UI.toast.open("Postagens encerradas!");
			}

			if ($(this).hasClass("disabled")) {
				// TODO melhorar mensagem
				UI.toast.open("Espere o fim do upload&hellip;");
				return;
			}

			let data = $("form", $app["post"]).serialize();
			// Exemplo de dados:
			// action=post
			// edicao=xciii
			// tarefa=2
			// user=744
			// turma=ec1
			// token=0ebe22be731dbd942ecb3e097a5ac2ae9d3185249f313eaec3a855ef2957594d
			// type=imagem
			// image-order[]=2-744-1488097013-578
			// caption=

			$(".submit-button", $app["post"]).addClass("disabled").html("Enviando&hellip;");

			$.post("/tarefas/" + tarefa_active + "/postar", data).done(function(response) {
				analytics("Conteúdo", "Tentativa");

				if (response["meta"]["status"] === 200) {
					app.Post.close();
					app.Tarefa.render(response["data"]);
					UI.toast.open(response["meta"]["message"]);
					navigator.vibrate(800);

					Lista.Tarefas[response["data"]["numero"]] = response["data"];
					analytics("Conteúdo", "Postagem");
				} else {
					UI.toast.open((response["meta"]["message"]? response["meta"]["message"] : "Ocorreu um erro. Tente novamente"));
					analytics("Conteúdo", "Erro");
				}
			}).fail(function() {
				UI.toast.open("Ocorreu um erro. Tente novamente", null, null, false);
				analytics("Conteúdo", "Erro");
			});

		}).on("click", ".back-button", function(event) {
			event.preventDefault();
			app.Post.close();
		});
	});

	return {

		////////////////////////////////////////////////////////////////////////////////////////////
		// app.Post.authorize()
		authorize: function() {
			// habilita o botão enviar
			$(".submit-button", $app["post"]).removeClass("disabled");
		},

		////////////////////////////////////////////////////////////////////////////////////////////
		// app.Post.deauthorize()
		deauthorize: function() {
			// desabilita o botão "enviar"
			$(".submit-button", $app["post"]).addClass("disabled");
		},

		////////////////////////////////////////////////////////////////////////////////////////////
		// app.Post.getThumbnail()
		getThumbnail: function(url) {
			// testa se urls são dos provider aceitos e responde com informações sobre o vídeo,
			// incluindo a url da miniatura
			// providers aceitos: youtube, vimeo, vine
			var media_info = { };

			function showThumbnail(media_info) {
				var $thumbnail = $("<img />").attr("src", media_info["thumbnail"]);
				$(".js-media-provider", $app["post"]).val(media_info["provider"]);
				$(".js-media-id", $app["post"]).val(media_info["id"]);
				$(".js-media-thumbnail", $app["post"]).val(media_info["thumbnail"]);
				$(".js-media-preview", $app["post"]).html($thumbnail).fadeIn();
			}

			// youtube
			if (url.match(/(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/)) {
				// https://www.youtube.com/watch?v=4ct4eNMrJlg
				var youtube_url = url.match(/(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/);
				media_info["provider"] = "youtube";
				media_info["id"] = youtube_url[1];
			//	media_info["thumbnail"] = "https://i1.ytimg.com/vi/" + youtube_url[1] + "/maxresdefault.jpg";
				media_info["thumbnail"] = "https://i1.ytimg.com/vi/" + youtube_url[1] + "/0.jpg";

				app.Post.authorize();
				showThumbnail(media_info);
			} else

			// vimeo
			if (url.match(/vimeo\.com/)) {
				// https://vimeo.com/64279649
				var vimeo_url = url.match(/\/\/(www\.)?vimeo.com\/(\d+)($|\/)/);
				media_info["provider"] = "vimeo";
				media_info["id"] = vimeo_url[2];

				$.getJSON("https://vimeo.com/api/v2/video/" + vimeo_url[2] + ".json?callback=?")
					.done(function(response) {
						media_info["thumbnail"] = response[0]["thumbnail_large"];

						app.Post.authorize();
						showThumbnail(media_info);
					});
			}
		},

		////////////////////////////////////////////////////////////////////////////////////////////
		// app.Post.open()
		open: function(type, numero) {
			var data = {
				"edicao": Lista.Edicao["titulo"],
				"numero": (numero || tarefa_active),
				"user": Lista.Usuario["id"],
				"turma": Lista.Usuario["turma"],
				"token": Lista.Usuario["token"]
			};
			var $new_post_view = __render("new-post-" + type, data);

			// efeito de abertura
			// _view.open($app["post"], $newPostView);
			$app["post"].html($new_post_view).addClass("in").reflow().addClass("slide-y").one("transitionend", function() {
				var view_theme_color = $(".appbar", $app["post"]).css("background-color");
				$("head meta[name='theme-color']").attr("content", view_theme_color);
			});

			app.Post.deauthorize();

			// ações para fazer quando abrir a tela de envio
			// de acordo com o tipo de postagem
			if (type === "photo") {
				$app["post"].dropzone();
				$(".file-placeholder", $app["post"]).trigger("click");
			//	$("form", $new_post_view).dropzone();
			} else

			if (type === "video" || type === "vine") {
				$(".js-media-url-input", $app["post"]).focus().on("keyup", function() {
				//	if ($.inArray(event.keyCode, [16, 17, 18])) { return; }
					app.Post.getThumbnail($(this).val());
				});
			} else

			if (type === "text") {
				$(".js-caption-input", $app["post"]).focus().on("keyup", function() {
					if ($(this).val().length > 0) {
						app.Post.authorize();
					} else {
						app.Post.deauthorize();
					}
				});
			}

			UI.backdrop.show($app["post"]);

			// view manager
			router["view-manager"].replace("new-post");
			history.replaceState({ "view": "new-post", "type": type, "id": data["numero"] }, null, null);
		},

		// send: function() {
		//
		// },

		////////////////////////////////////////////////////////////////////////////////////////////
		// app.Post.close()
		close: function() {
		//	tarefa_active = null;
			$("head meta[name='theme-color']").attr("content", UI.data["theme-color"]["original"]);

			$app["post"].removeClass("slide-y").one("transitionend", function() {
				$app["post"].removeClass("in").empty();
				UI.backdrop.hide($app["post"]);
			});

			router["view-manager"].replace("tarefa");
		}
	};
})();

////////////////////////////////////////////////////////////////////////////////////////////////////
// image upload ////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
var file_stack = { };

function upload(files) {
	let exif_orientation_to_degrees = {
		0: 0,
		1: 0,
		2: 0,
		3: 180,
		4: 0,
		5: 0,
		6: 90,
		7: 0,
		8: 270
	};

	FileAPI.filterFiles(files, function(file, info) {
		if (/^image/.test(file.type)) {
			file_stack[file["name"]] = info;
			return true;
		//	return info.width >= 320 && info.height >= 240;
		}
		return false;
	}, function(files, rejected) {
		if (files.length) {
			$(".submit", $app["post"]).addClass("disabled");

			// preview
			FileAPI.each(files, function(file) {
				var exif_orientation = file_stack[file["name"]]["exif"]["Orientation"];
				file_stack[file["name"]]["ref"] = tarefa_active + "-" + Lista.Usuario["id"] + "-" +
					moment().format("X") + "-" + rand(0, 999).toFixed(0);

				if (file["type"] == "image/gif") {
					var reader = new FileReader();
					reader.onload = function(event) {
						var img = $("<img />").attr("src", event.target.result);
						var $tracker = $("<input type=\"hidden\" name=\"image-order[]\" />").val(file_stack[file["name"]]["ref"]);

						var $status = $("<div />").addClass("progress");
						$("<div />").addClass("status").html("<strong>Enviando&hellip;</strong>").appendTo($status);
						$("<div />").addClass("bar").appendTo($status);

						var $preview = $("<li />").attr("id", "file-" +
								file_stack[file["name"]]["ref"]).append($tracker).append($status).append(img);
						$("#dropzone #board").append($preview);
					};
					reader.readAsDataURL(file);
				} else {
					FileAPI
						.Image(file)
						.rotate(exif_orientation_to_degrees[exif_orientation])
						.resize(600, 300, "preview")
						.get(function(err, img) {
						//	$tracker = $("<input type=\"hidden\" name=\"image-order[]\" />")
						//		.val(tarefa_active + "-" + Lista.Usuario["id"] + "-" + file["name"]);
							var $tracker = $("<input type=\"hidden\" name=\"image-order[]\" />").val(file_stack[file["name"]]["ref"]);

							var $status = $("<div />").addClass("progress");
							$("<div />").addClass("status").html("<strong>Enviando&hellip;</strong>").appendTo($status);
							$("<div />").addClass("bar").appendTo($status);

							var $preview = $("<li />").attr("id", "file-" +
									file_stack[file["name"]]["ref"]).append($tracker).append($status).append(img);
							$("#dropzone #board").append($preview);
						});
				}
			});

			// upload
			FileAPI.upload({
				url: "/tarefas/" + tarefa_active + "/postar",
				data: {
					"action": "upload",
					"edicao": Lista.Edicao["titulo"],
					"tarefa": tarefa_active,
					"turma": Lista.Usuario["turma"],
					"user": Lista.Usuario["id"]
				},
				prepare: function(file, options) {
					options.data.ref = file_stack[file["name"]]["ref"];
					file.ref = file_stack[file["name"]]["ref"];
				},

				imageAutoOrientation: (files[0]["type"] !== "image/gif"? true : null),
				imageTransform: (files[0]["type"] !== "image/gif"? {
					maxWidth: 1920,
					maxHeight: 1920
				} : null),

				files: files,
				fileprogress: function(event, file, xhr) {
					var percent = ((event["loaded"] / event["total"]) * 100).toFixed(0),
						status = (percent < 100? "<strong>Enviando&hellip;</strong> " +
								percent + "%" : "<strong>Processando&hellip;</strong>");

					$("#file-" + file["ref"] + " .status", "#dropzone").html(status);
				},
				progress: function(event) {
				//	var percent = ((event["loaded"] / event["total"]) * 100).toFixed(0) + "%"
				//	console.log(percent);
				},
				filecomplete: function(file, xhr, options) {
				//	console.log(file, xhr, options);
					$("#file-" + options["ref"] + " .status", "#dropzone").html("<i class=\"material-icons\">check</i>");
				},
				complete: function(err, xhr) {
					app.Post.authorize();
					// $(".submit-button", $app["post"]).removeClass("disabled");
				}
			});
		}
	});
}

$.fn.dropzone = function() {
	// dropzone
	var $dropzone = $("#dropzone", this);
	FileAPI.event.dnd($dropzone[0], function(over) {
		if (over) {
			$dropzone.addClass("active");
		} else {
			$dropzone.removeClass("active");
		}
	}, function(files) {
		upload(files);
	});

	// manual select
	var $file_input = document.getElementById("form-file");
	FileAPI.event.on($file_input, "change", function(event) {
		var files = FileAPI.getFiles(event);
		upload(files);
	});

	// reorder
	var $board = $("#board", this);
	$board.on("slip:beforewait", function(event) {
		if (UI.data["interaction-type"] === "pointer") {
			event.preventDefault();
		}
	}).on("slip:afterswipe", function(event) {
		event.target.remove();
	}).on("slip:reorder", function(event) {
		event = event.originalEvent;
		event.target.parentNode.insertBefore(event.target, event.detail.insertBefore);
		return false;
	});

	new Slip($board[0]);
};

////////////////////////////////////////////////////////////////////////////////////////////////////
// login ///////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
// app.Login.open()
// app.Login.close()
// app.Login.submit() [?]
// app.Login.logout()

app.Login = (function() {
	Lista.Usuario = {
		"id": null,
		"name": null,
		"email": null,
		"token": null,
		"turma": null,
		"signed-in": false
	};

	// Se tiver dados guardados no localStorage, usa eles pra logar
	if (localStorage && localStorage.getItem("Lista.Usuario")) {
		Lista.Usuario = JSON.parse(localStorage.getItem("Lista.Usuario"));

		$(function() {
			if (Lista.Usuario["id"] !== null) {
				$ui["body"].addClass("signed-in user-" + Lista.Usuario["turma"]);

				// Mostra toast somente após 3 segundos
				// depois do load da Lista
				cue["load-edicao"].done(function() {
					setTimeout(function() {
						UI.toast.show("Olá " + Lista.Usuario["name"] + "!");
					}, 3000);
				});
			}
		});
	}

	$(function() {
		$ui["login"] = $(".app-login");
		$ui["login"]["button"] = $(".js-login-button", $ui["login"]);

		// Botões de login e logout
		$(".js-login-trigger", $ui["sidenav"]).on("click", function(event) {
			event.preventDefault();
			UI.sidenav.close();
			app.Login.show();
		});

		$(".js-logout-trigger", $ui["sidenav"]).on("click", function(event) {
			event.preventDefault();
			UI.sidenav.close();
			app.Login.logout();
		});

		// Ação de login
		$ui["login"].on("click", ".back-button", function(event) {
			event.preventDefault();
			app.Login.hide();
		}).on("submit", "form", function(event) {
			event.preventDefault();

			$(".js-login-button", $ui["form"]).trigger("click");
			let login_data = $("form", $ui["login"]).serialize();
			app.Login.submit(login_data);
		});
	});

	return {
		////////////////////////////////////////////////////////////////////////////////////////////
		// app.Login.show()
		show: function() {
			// Abre a tela de login e coloca o foco no campo e-mail
			$ui["login"].addClass("in").reflow().addClass("slide").one("transitionend", function() {
				UI.body.lock();
				UI.backdrop.show($ui["login"]);
				$("input[name='email']", $ui["login"]).focus();
			});
		},

		////////////////////////////////////////////////////////////////////////////////////////////
		// app.Login.hide()
		hide: function() {
			$ui["login"].removeClass("slide").one("transitionend", function() {
				$ui["login"].removeClass("in");
				UI.backdrop.hide($ui["login"]);
				UI.body.unlock();
			});
		},

		////////////////////////////////////////////////////////////////////////////////////////////
		// app.Login.submit()
		submit: function(data) {
			// Desativa o botão e coloca mensagem de espera
			$ui["login"]["button"]
				.prop("disabled", true)
				.text("Aguarde…");

			// Envia pedido para a API
			ListaAPI("/identificacao", data).done(function(response) {
				if (response["meta"]["status"] === 200) {
					Lista.Usuario = response["user"];
					Lista.Usuario["signed-in"] = true;
					localStorage.setItem("Lista.Usuario", JSON.stringify(Lista.Usuario));

					$ui["body"].addClass("signed-in user-" + Lista.Usuario["turma"]);
					app.Login.hide();
					setTimeout(function() {
						UI.toast.show("Olá " + Lista.Usuario["name"] + "!");
					}, 500);

					analytics("Login", "Acesso");
				} else {
					// Se tentativa for recusada,
					// coloca animação no campo de login por 1 segundo
					$(".form-group", $ui["login"]).addClass("animated shake");

					setTimeout(function() {
						$(".form-group", $ui["login"]).removeClass("animated shake");
					}, 1000);

					analytics("Login", "Erro");
				}
			}).fail(function() {
				UI.toast.show("Ocorreu um erro. Tente novamente");
				analytics("Login", "Erro");
			}).always(function() {
				$ui["login"]["button"]
					.prop("disabled", false)
					.text("Login");
				analytics("Login", "Tentativa");
			});
		},

		////////////////////////////////////////////////////////////////////////////////////////////
		// app.Login.logout()
		logout: function() {
			// Tira as classes indicadoras de login do body
			$ui["body"].removeClass("signed-in user-" + Lista.Usuario["turma"]);

			// Limpa Lista.Usuario tanto na página quanto no localStorage
			Lista.Usuario = {
				"id": null,
				"name": null,
				"email": null,
				"token": null,
				"turma": null,
				"signed-in": false
			};

			localStorage.setItem("Lista.Usuario", JSON.stringify(Lista.Usuario));

			// Depois de 0,5 segundo,
			// mostra toast confirmando logout
			setTimeout(function() {
				UI.toast.show("Sessão encerrada!");
			}, 500);

			analytics("Login", "Logout");
		}
	};
})();

////////////////////////////////////////////////////////////////////////////////////////////////////
// workers /////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

// start
worker.Start = (function() {
	timing["delay-start"] = setTimeout(function() {
		log("worker.Start", "info");

		cue["load-edicao"] = $.Deferred();
		cue["first-load"] = true;

		cue["load-edicao"].done(function() {
			// Se tiver número de tarefa especificado na URL, abre ela
			if (router["path"] && router["path"][2]) {
				// Antes, testa se o valor é um número
				// e dentro do número de tarefas dessa Edição
				let numero = router["path"][2];
				if (!isNaN(numero) && numero >= 1 && numero <= Lista.Edicao["numero-de-tarefas"]) {
					app.Tarefa.open(numero, false, false);
				}
			}

			// Se for o primeiro load
			if (cue["first-load"]) {
				// Inicia a barra de evolução
				timing["delay-evolucao"] = setTimeout(app.Evolucao.start, 100);

				// Inicia a checagem de atividade
				worker.Update();

				// Desativa nos loads seguintes
				cue["first-load"] = false;
			}

			// app.Placar.start();
		});

		timing["delay-load"] = setTimeout(function() {
			worker.Load();
		}, 300);

		analytics("Lista", "Acesso");
	}, 0);
})();


// load
worker.Load = (function() {
	log("worker.Load", "info");

	ListaAPI("/tudo").done(function(response) {
		Lista.Edicao = response["edicao"];
		Lista.Placar = response["placar"];
		Lista.Tarefas = response["tarefas"];

		timing["delay-lista"] = setTimeout(function() {
			// Dispara a função de montagem da Lista
			app.Lista.start();
			app.Placar.update();

			// Resolve a promise load-edicao
			cue["load-edicao"].resolve();
			log("cue[\"load-edicao\"] triggered");
		}, 1);

		// timing["delay-placar"] = setTimeout(app.Placar.start, 400);
	});
});


// update
worker.Update = (function() {
	let updates = {
		"tarefas": 0,
		"posts": 0,
		"total": 0,
		"last-updated": null
	};

	timing["atividade"] = setInterval(function() {
		log("worker.Update", "info");

		ListaAPI("/atividade").done(function(response) {
			// console.info(updates);
			// Confere data de cada atividade e vê se é posterior à última atualização.
			// Se for, adiciona à contagem de nova atividade
			for (let atividade of response) {
				// console.log(moment(atividade["ts"]).isAfter(updates["last-updated"]));
				if (moment(atividade["ts"]).isAfter(updates["last-updated"]) && atividade["autor"] != Lista.Usuario["id"]) {
					updates["total"]++;

					if (atividade["acao"] === "nova-tarefa") {
						updates["tarefas"]++;
					} else if (atividade["acao"] === "novo-post") {
						updates["posts"]++;
					}
				}
			}

			// Se houver nova atividade
			if (updates["total"] > 0) {
				// Monta o texto do toast
				let texto = {
					"tarefas": updates["tarefas"] + " " + (updates["tarefas"] > 1? "novas tarefas" : "nova tarefa"),
					"posts": updates["posts"] + " " + (updates["posts"] > 1? "novos posts" : "novo post"),
					"final": ""
				};

				if (updates["tarefas"] > 0) {
					texto["final"] += texto["tarefas"];
				}
				if ((updates["tarefas"] > 0) && (updates["posts"] > 0)) {
					texto["final"] += " e ";
				}
				if (updates["posts"] > 0) {
					texto["final"] += texto["posts"];
				}

				// Mostra o toast
				UI.toast.show({
					"message": texto["final"],
					"label": "Atualizar",
					"action": function() {
						worker.Load();
						updates["tarefas"] = 0;
						updates["posts"] = 0;
						updates["total"] = 0;
						$ui["page-title"].html(UI.data["page-title"]);
						analytics("Lista", "Atualização");
					},
					"persistent": true,
					"start-only": true
				});

				// Mostra número de novas atividades no título
				$ui["title"].html("(" + updates["total"] + ") " + UI.data["page-title"]);
			}

			updates["last-updated"] = (response[0]? moment(response[0]["ts"]) : moment());

			// console.log(response, updates);
		});
	}, 30000);
});

////////////////////////////////////////////////////////////////////////////////////////////////////
// fonts ///////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

// Cria uma promise que será resolvida
// quando as fontes forem carregadas
cue["load-fonts"] = $.Deferred();

WebFont.load({
	timeout: 15000,
	google: {
		families: [
			"Material Icons",
			// "Roboto:400,400italic,500:latin",
			// "Roboto+Mono:700:latin",
			"Lato:400:latin"
		]
	},
	custom: {
		families: [
			"FontAwesome"
		],
		urls: [
			"https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"
		]
	},
	active: function() {
		cue["load-fonts"].resolve();

		$(function() {
			app.Lista.layout();
		});
	}
});

////////////////////////////////////////////////////////////////////////////////////////////////////
// momentjs ////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

moment.locale("pt-br", {
		"months": "janeiro_fevereiro_março_abril_maio_junho_julho_agosto_setembro_outubro_novembro_dezembro".split("_"),
		"monthsShort": "jan_fev_mar_abr_mai_jun_jul_ago_set_out_nov_dez".split("_"),
		"weekdays": "domingo_segunda-feira_terça-feira_quarta-feira_quinta-feira_sexta-feira_sábado".split("_"),
		"weekdaysShort": "dom_seg_ter_qua_qui_sex_sáb".split("_"),
		"weekdaysMin": "dom_2ª_3ª_4ª_5ª_6ª_sáb".split("_"),
		"longDateFormat": {
			"LT": "HH:mm",
			"LTS": "HH:mm:ss",
			"L": "DD/MM/YYYY",
			"LL": "D [de] MMMM [de] YYYY",
			"LLL": "D [de] MMMM [de] YYYY [às] HH:mm",
			"LLLL": "dddd, D [de] MMMM [de] YYYY [às] HH:mm"
		},
		"calendar": {
			"sameDay": "[hoje] LT",
			"nextDay": "[amanhã] LT",
			"nextWeek": "dddd LT",
			"lastDay": "[ontem] LT",
			"lastWeek": "dddd LT",
			"sameElse": "L"
		},
		"relativeTime": {
			"future": "daqui %s",
			"past": "%s atrás",
			"s": "poucos segundos",
			"m": "um minuto",
			"mm": "%d minutos",
			"h": "uma hora",
			"hh": "%d horas",
			"d": "um dia",
			"dd": "%d dias",
			"M": "um mês",
			"MM": "%d meses",
			"y": "um ano",
			"yy": "%d anos"
		},
		"ordinalParse": /\d{1,2}º/,
		"ordinal": "%dº"
	});
