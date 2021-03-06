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
