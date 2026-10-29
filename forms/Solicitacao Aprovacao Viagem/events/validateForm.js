// Números das atividades no diagrama do processo — mantenha igual ao displayFields.js.
var ATIVIDADES_INICIO = [0, 4];
var ATIVIDADE_APROVACAO_GESTOR = 5;
var ATIVIDADE_AJUSTE = 6;

function validateForm(form) {
	var atividade = parseInt(getValue("WKNumState"), 10);
	var msg = "";

	if (atividade == ATIVIDADE_APROVACAO_GESTOR) {
		msg = validarAprovacao(form);
	} else if (ATIVIDADES_INICIO.indexOf(atividade) > -1 || atividade == ATIVIDADE_AJUSTE) {
		msg = validarSolicitacao(form);
	}

	if (msg != "") {
		throw msg;
	}
}

function validarSolicitacao(form) {
	var erros = [];
	var msg = "";

	var obrigatorios = [
		["telefoneSolicitante", "Telefone"],
		["departamento", "Departamento"],
		["centroCusto", "Centro de Custo"],
		["gestorImediato", "Gestor Imediato"],
		["tipoViagem", "Tipo de Viagem"],
		["motivoViagem", "Motivo"],
		["dataIda", "Data de Ida"],
		["dataVolta", "Data de Volta"],
		["cidadeOrigem", "Cidade de Origem"],
		["cidadeDestino", "Cidade de Destino"],
		["objetivoViagem", "Objetivo / Justificativa da Viagem"]
	];

	if (form.getValue("viajanteEhSolicitante") == "N") {
		obrigatorios.push(["nomeViajante", "Nome do Viajante"], ["cpfViajante", "CPF do Viajante"]);
	}
	if (form.getValue("tipoViagem") == "INTERNACIONAL") {
		obrigatorios.push(["paisDestino", "País de Destino"], ["numPassaporte", "Nº do Passaporte"], ["validadePassaporte", "Validade do Passaporte"]);
	}
	if (form.getValue("prioridade") == "URGENTE") {
		obrigatorios.push(["justificativaUrgencia", "Justificativa da Urgência"]);
	}
	if (form.getValue("necessitaHospedagem") == "S") {
		obrigatorios.push(["checkin", "Check-in"], ["checkout", "Check-out"]);
	}
	if (form.getValue("solicitaAdiantamento") == "S") {
		obrigatorios.push(["valorAdiantamento", "Valor do Adiantamento"]);
	}

	for (var i = 0; i < obrigatorios.length; i++) {
		if (vazio(form.getValue(obrigatorios[i][0]))) {
			erros.push(obrigatorios[i][1]);
		}
	}
	if (erros.length > 0) {
		msg += "Preencha os campos obrigatórios: " + erros.join(", ") + ".\n";
	}

	var cpf = form.getValue("cpfViajante");
	if (form.getValue("viajanteEhSolicitante") == "N" && !vazio(cpf) && !cpfValido(cpf)) {
		msg += "CPF do viajante inválido.\n";
	}

	var hoje = new Date();
	hoje.setHours(0, 0, 0, 0);
	var ida = paraData(form.getValue("dataIda"));
	var volta = paraData(form.getValue("dataVolta"));
	if (ida && ida < hoje.getTime()) {
		msg += "A data de ida não pode ser anterior a hoje.\n";
	}
	if (ida && volta && volta < ida) {
		msg += "A data de volta deve ser igual ou posterior à data de ida.\n";
	}

	if (form.getValue("tipoViagem") == "INTERNACIONAL") {
		var validade = paraData(form.getValue("validadePassaporte"));
		if (validade && volta && validade < volta) {
			msg += "O passaporte vence antes da data de volta da viagem.\n";
		}
	}

	if (form.getValue("necessitaHospedagem") == "S") {
		var checkin = paraData(form.getValue("checkin"));
		var checkout = paraData(form.getValue("checkout"));
		if (checkin && checkout && checkout <= checkin) {
			msg += "O check-out deve ser posterior ao check-in.\n";
		}
	}

	var indicesTrechos = form.getChildrenIndexes("tbTrechos");
	if (indicesTrechos.length == 0) {
		msg += "Informe ao menos um trecho de transporte.\n";
	}
	for (var t = 0; t < indicesTrechos.length; t++) {
		var ti = indicesTrechos[t];
		if (vazio(form.getValue("trechoOrigem___" + ti)) || vazio(form.getValue("trechoDestino___" + ti)) || vazio(form.getValue("trechoData___" + ti))) {
			msg += "Trecho " + (t + 1) + ": preencha origem, destino e data.\n";
		}
	}

	var indicesDespesas = form.getChildrenIndexes("tbDespesas");
	if (indicesDespesas.length == 0) {
		msg += "Informe ao menos uma despesa estimada.\n";
	}
	for (var d = 0; d < indicesDespesas.length; d++) {
		var di = indicesDespesas[d];
		var valor = paraNumero(form.getValue("despesaValor___" + di));
		if (valor == null || valor <= 0) {
			msg += "Despesa " + (d + 1) + ": informe um valor maior que zero.\n";
		}
	}

	if (form.getValue("solicitaAdiantamento") == "S") {
		var adiantamento = paraNumero(form.getValue("valorAdiantamento"));
		var total = paraNumero(form.getValue("totalEstimado"));
		if (adiantamento != null && total != null && adiantamento > total) {
			msg += "O adiantamento não pode ser maior que o total estimado.\n";
		}
	}

	return msg;
}

function validarAprovacao(form) {
	var decisao = form.getValue("decisaoGestor");
	if (vazio(decisao)) {
		return "Informe a decisão da aprovação.\n";
	}
	if ((decisao == "REPROVADO" || decisao == "AJUSTE") && vazio(form.getValue("parecerGestor"))) {
		return "Informe o parecer justificando a reprovação ou o ajuste.\n";
	}
	return "";
}

function vazio(valor) {
	return valor == null || String(valor).trim() == "";
}

function paraNumero(valor) {
	if (vazio(valor)) return null;
	var n = parseFloat(String(valor).replace(/\./g, "").replace(",", "."));
	return isNaN(n) ? null : n;
}

function paraData(valor) {
	if (vazio(valor)) return null;
	var p = String(valor).split("/");
	if (p.length != 3) return null;
	return new Date(parseInt(p[2], 10), parseInt(p[1], 10) - 1, parseInt(p[0], 10)).getTime();
}

function cpfValido(cpf) {
	cpf = String(cpf).replace(/\D/g, "");
	if (cpf.length != 11 || /^(\d)\1+$/.test(cpf)) return false;
	var calc = function (base, pesoInicial) {
		var soma = 0;
		for (var i = 0; i < base.length; i++) soma += parseInt(base.charAt(i), 10) * (pesoInicial - i);
		var resto = (soma * 10) % 11;
		return resto == 10 ? 0 : resto;
	};
	var d1 = calc(cpf.substring(0, 9), 10);
	var d2 = calc(cpf.substring(0, 10), 11);
	return cpf.charAt(9) == d1 && cpf.charAt(10) == d2;
}
