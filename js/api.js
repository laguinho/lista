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
