// Números das atividades no diagrama do processo — ajuste conforme o seu fluxo.
var ATIVIDADES_INICIO = [0, 4];
var ATIVIDADE_APROVACAO_GESTOR = 5;
var ATIVIDADE_AJUSTE = 6;

function displayFields(form, customHTML) {
	var modo = form.getFormMode();
	var atividade = parseInt(getValue("WKNumState"), 10);
	var ehInicio = ATIVIDADES_INICIO.indexOf(atividade) > -1;

	form.setValue("atividadeAtual", atividade);

	if (modo == "ADD") {
		var usuario = getValue("WKUser");
		var hoje = new java.text.SimpleDateFormat("dd/MM/yyyy").format(new java.util.Date());
		form.setValue("dataSolicitacao", hoje);
		form.setValue("matriculaSolicitante", usuario);

		var filtro = DatasetFactory.createConstraint("colleaguePK.colleagueId", usuario, usuario, ConstraintType.MUST);
		var colaborador = DatasetFactory.getDataset("colleague", null, [filtro], null);
		if (colaborador != null && colaborador.rowsCount > 0) {
			form.setValue("nomeSolicitante", colaborador.getValue(0, "colleagueName"));
			form.setValue("emailSolicitante", colaborador.getValue(0, "mail"));
		}
	}

	if (getValue("WKNumProces") != null) {
		form.setValue("numSolicitacao", getValue("WKNumProces"));
	}

	if (atividade == ATIVIDADE_APROVACAO_GESTOR && modo == "MOD") {
		// Na aprovação, o gestor apenas consulta os dados da solicitação
		bloquearCamposSolicitacao(form);
		var gestor = getValue("WKUser");
		var filtroGestor = DatasetFactory.createConstraint("colleaguePK.colleagueId", gestor, gestor, ConstraintType.MUST);
		var dsGestor = DatasetFactory.getDataset("colleague", null, [filtroGestor], null);
		form.setValue("aprovador", dsGestor != null && dsGestor.rowsCount > 0 ? dsGestor.getValue(0, "colleagueName") : gestor);
		form.setValue("dataAprovacao", new java.text.SimpleDateFormat("dd/MM/yyyy HH:mm").format(new java.util.Date()));
		customHTML.append("<script>$(function(){ $('.btn-acao').hide(); });</script>");
	} else {
		form.setEnabled("decisaoGestor", false);
		form.setEnabled("parecerGestor", false);
	}

	// Na abertura ou no ajuste o painel de aprovação só aparece se já houver um parecer
	if (ehInicio || (atividade == ATIVIDADE_AJUSTE && vazio(form.getValue("decisaoGestor")))) {
		customHTML.append("<script>$(function(){ $('#painelAprovacao').hide(); });</script>");
	}

	if (modo == "VIEW") {
		customHTML.append("<script>$(function(){ $('.btn-acao').hide(); });</script>");
	}

	form.setShowDisabledFields(true);
	form.setHidePrintLink(false);
}

function bloquearCamposSolicitacao(form) {
	var campos = [
		"telefoneSolicitante", "departamento", "centroCusto", "gestorImediato",
		"viajanteEhSolicitante", "nomeViajante", "cpfViajante", "nascimentoViajante", "vinculoViajante",
		"tipoViagem", "motivoViagem", "dataIda", "dataVolta", "cidadeOrigem", "cidadeDestino", "prioridade",
		"paisDestino", "numPassaporte", "validadePassaporte", "necessitaVisto",
		"justificativaUrgencia", "objetivoViagem",
		"necessitaHospedagem", "checkin", "checkout", "hotelPreferencia",
		"solicitaAdiantamento", "valorAdiantamento", "observacoes"
	];
	for (var i = 0; i < campos.length; i++) {
		form.setEnabled(campos[i], false);
	}

	var filhos = {
		tbTrechos: ["trechoMeio", "trechoOrigem", "trechoDestino", "trechoData", "trechoHorario"],
		tbDespesas: ["despesaCategoria", "despesaDescricao", "despesaValor"]
	};
	for (var tabela in filhos) {
		var indices = form.getChildrenIndexes(tabela);
		for (var j = 0; j < indices.length; j++) {
			for (var k = 0; k < filhos[tabela].length; k++) {
				form.setEnabled(filhos[tabela][k] + "___" + indices[j], false);
			}
		}
	}
}

function vazio(valor) {
	return valor == null || String(valor).trim() == "";
}
