var DashViagem = SuperWidget.extend({
    //código do formulário "Solicitacao Aprovacao Viagem" no GED (Viagens > ViagemAprovacao)
    CODIGO_FORMULARIO: 46,
    CAMPO_DATA: 'dataSolicitacao',
    DIAS: 30,
    QTD_LISTA: 20,

    //rótulo e cor da situação, conforme o campo decisaoGestor
    SITUACOES: {
        '': { texto: 'Aguardando aprovação', classe: 'label-info' },
        'APROVADO': { texto: 'Aprovado', classe: 'label-success' },
        'REPROVADO': { texto: 'Reprovado', classe: 'label-danger' },
        'AJUSTE': { texto: 'Em ajuste', classe: 'label-warning' }
    },

    //variáveis da widget
    datasetName: null,
    grafico: null,

    //método iniciado quando a widget é carregada
    init: function() {
        this.datasetName = $.trim(this.datasetName || '');
        if (this.isEditMode) return;
        this.carregar();
    },

    //BIND de eventos
    bindings: {
        local: {
            'atualizar': ['click_carregar'],
            'salvar-config': ['click_salvarConfig']
        },
        global: {}
    },

    carregar: function() {
        var that = this;
        var dias = that.ultimosDias();

        $('#mensagem_' + that.instanceId).empty();
        that.carregarBibliotecaGrafico()
            .then(function() { return that.resolverDataset(); })
            .then(function() { return that.buscarSolicitacoes(); })
            .done(function(registros) {
                var contagem = that.contarPorDia(dias, registros);
                that.renderResumo(contagem);
                that.renderDiagnostico(registros, contagem);
                that.renderLista(registros);
                that.executarComAviso(function() {
                    that.renderGrafico(dias, contagem);
                });
            })
            .fail(function(xhr) {
                var erro = (typeof xhr == 'string' && xhr) || (xhr && xhr.responseJSON && xhr.responseJSON.message && xhr.responseJSON.message.message) || (xhr && xhr.statusText) || 'erro desconhecido';
                $('#mensagem_' + that.instanceId).html(
                    $('<div class="alert alert-danger"></div>').text('Não foi possível consultar o dataset "' + (that.datasetName || '?') + '": ' + erro)
                );
            });
    },

    //o FLUIGC.chart não vem no style guide padrão; carrega a biblioteca de gráficos se ainda não estiver na página
    carregarBibliotecaGrafico: function() {
        if (window.Chart) return $.Deferred().resolve().promise();
        return $.ajax({
            url: '/style-guide/js/fluig-style-guide-chart.min.js',
            dataType: 'script',
            cache: true
        }).then(null, function() {
            return $.Deferred().reject('não foi possível carregar a biblioteca de gráficos (fluig-style-guide-chart.min.js).').promise();
        });
    },

    //exibe no painel o erro de renderização, em vez de deixar o gráfico em branco
    executarComAviso: function(fn) {
        try {
            fn();
        } catch (e) {
            console.error('[DashViagem]', e);
            $('#mensagem_' + this.instanceId).append(
                $('<div class="alert alert-danger"></div>').text('Erro ao desenhar o gráfico: ' + (e && e.message ? e.message : e))
            );
        }
    },

    consultarDataset: function(nome, fields, constraints) {
        return $.ajax({
            url: '/api/public/ecm/dataset/datasets',
            type: 'POST',
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify({ name: nome, fields: fields, constraints: constraints, order: null })
        }).then(function(resposta) {
            console.log('[DashViagem] dataset ' + nome, resposta);
            return (resposta && resposta.content && resposta.content.values) || [];
        });
    },

    //sem nome configurado no modo de edição, descobre o dataset pelo código do formulário
    resolverDataset: function() {
        var that = this;
        if (that.datasetName) return $.Deferred().resolve().promise();

        return that.consultarDataset('document', null, [
            { _field: 'documentPK.documentId', _initialValue: String(that.CODIGO_FORMULARIO), _finalValue: String(that.CODIGO_FORMULARIO), _type: 1, _likeSearch: false },
            { _field: 'activeVersion', _initialValue: 'true', _finalValue: 'true', _type: 1, _likeSearch: false }
        ]).then(function(registros) {
            var nome = registros.length > 0 ? $.trim(that.valorCampo(registros[0], 'datasetName')) : '';
            if (!nome) {
                return $.Deferred().reject('o formulário ' + that.CODIGO_FORMULARIO + ' não foi encontrado ou não tem dataset. Informe o nome do dataset no modo de edição da widget.').promise();
            }
            that.datasetName = nome;
        });
    },

    //lista as datas (dd/MM/yyyy) dos últimos 30 dias, do mais antigo até hoje
    ultimosDias: function() {
        var dias = [];
        var hoje = new Date();
        for (var i = this.DIAS - 1; i >= 0; i--) {
            var d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - i);
            dias.push(this.pad(d.getDate()) + '/' + this.pad(d.getMonth() + 1) + '/' + d.getFullYear());
        }
        return dias;
    },

    //consulta as fichas ativas do formulário; o filtro do período é feito em contarPorDia,
    //pois dataSolicitacao é texto dd/MM/yyyy e não aceita filtro por intervalo no dataset
    buscarSolicitacoes: function() {
        return this.consultarDataset(this.datasetName, null, [
            { _field: 'metadata#active', _initialValue: 'true', _finalValue: 'true', _type: 1, _likeSearch: false }
        ]);
    },

    contarPorDia: function(dias, registros) {
        var that = this;
        var contagem = {};
        $.each(dias, function(i, dia) { contagem[dia] = 0; });
        $.each(registros, function(i, registro) {
            var dia = that.diaSolicitacao(registro);
            if (contagem.hasOwnProperty(dia)) contagem[dia]++;
        });
        return contagem;
    },

    //considera só a parte dd/MM/yyyy, caso o valor venha com hora
    diaSolicitacao: function(registro) {
        return $.trim(this.valorCampo(registro, this.CAMPO_DATA)).substring(0, 10);
    },

    //lê o campo ignorando maiúsculas/minúsculas no nome da coluna
    valorCampo: function(registro, campo) {
        if (registro[campo] != null) return String(registro[campo]);
        for (var chave in registro) {
            if (chave.toLowerCase() == campo.toLowerCase()) return String(registro[chave] || '');
        }
        return '';
    },

    //explica na tela por que o gráfico ficou vazio
    renderDiagnostico: function(registros, contagem) {
        var that = this;
        var total = 0;
        $.each(contagem, function(dia, qtd) { total += qtd; });
        if (total > 0) return;

        var msg;
        if (registros.length == 0) {
            msg = 'O dataset "' + that.datasetName + '" não retornou nenhuma ficha. Confira o nome do dataset no modo de edição da widget.';
        } else {
            var exemplos = $.map(registros.slice(-3), function(r) { return '"' + that.valorCampo(r, that.CAMPO_DATA) + '"'; });
            msg = 'O dataset "' + that.datasetName + '" retornou ' + registros.length + ' ficha(s), mas nenhuma com ' + that.CAMPO_DATA +
                ' nos últimos ' + that.DIAS + ' dias. Valores encontrados: ' + exemplos.join(', ') + '.';
        }
        $('#mensagem_' + that.instanceId).html($('<div class="alert alert-warning"></div>').text(msg));
    },

    renderResumo: function(contagem) {
        var total = 0;
        $.each(contagem, function(dia, qtd) { total += qtd; });
        var hoje = this.ultimosDias().pop();

        $('#total_' + this.instanceId).text(total);
        $('#media_' + this.instanceId).text((total / this.DIAS).toFixed(2).replace('.', ','));
        $('#hoje_' + this.instanceId).text(contagem[hoje] || 0);
    },

    renderGrafico: function(dias, contagem) {
        var container = $('#grafico_' + this.instanceId);
        var valores = $.map(dias, function(dia) { return contagem[dia]; });

        if (this.grafico) {
            this.grafico.destroy();
        }
        container.empty();

        var dados = {
            labels: $.map(dias, function(dia) { return dia.substring(0, 5); }),
            datasets: [{
                label: 'Solicitações',
                strokeColor: 'rgba(84, 112, 198, 1)',
                pointColor: 'rgba(84, 112, 198, 1)',
                pointStrokeColor: '#fff',
                data: valores
            }]
        };

        //escala fixa em números inteiros começando em zero (sem 0,1 / 0,2 nem valores negativos)
        var maximo = Math.max.apply(null, valores.concat([1]));
        var passo = Math.ceil(maximo / 10);

        var chart = FLUIGC.chart('#grafico_' + this.instanceId, {
            id: 'graficoDashViagem_' + this.instanceId,
            width: container.width() || 700,
            height: 260
        });
        this.grafico = chart.line(dados, {
            responsive: true,
            scaleOverride: true,
            scaleStartValue: 0,
            scaleStepWidth: passo,
            scaleSteps: Math.ceil(maximo / passo) + 1,
            bezierCurve: true,
            datasetFill: false,
            pointDotRadius: 4,
            //os valores ficam escritos sobre os pontos, então o tooltip é dispensável
            showTooltips: false,
            onAnimationComplete: function() {
                var ctx = this.chart.ctx;
                ctx.font = '12px Arial';
                ctx.fillStyle = 'rgba(84, 112, 198, 1)';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                $.each(this.datasets, function(i, dataset) {
                    $.each(dataset.points, function(j, ponto) {
                        if (ponto.value > 0) ctx.fillText(ponto.value, ponto.x, ponto.y - 6);
                    });
                });
            }
        });
    },

    //últimas solicitações: mais recente primeiro pela data da solicitação e, no mesmo dia, pelo código da ficha
    renderLista: function(registros) {
        var that = this;
        var ordenados = registros.slice().sort(function(a, b) {
            var chaveA = that.dataOrdenavel(that.diaSolicitacao(a));
            var chaveB = that.dataOrdenavel(that.diaSolicitacao(b));
            if (chaveA != chaveB) return chaveA < chaveB ? 1 : -1;
            return (parseInt(that.valorCampo(b, 'metadata#id'), 10) || 0) - (parseInt(that.valorCampo(a, 'metadata#id'), 10) || 0);
        });

        var solicitacoes = $.map(ordenados.slice(0, that.QTD_LISTA), function(r) {
            var numero = $.trim(that.valorCampo(r, 'numSolicitacao'));
            var situacao = that.SITUACOES[$.trim(that.valorCampo(r, 'decisaoGestor'))] || that.SITUACOES[''];
            return {
                numero: numero,
                link: numero ? '/portal/p/' + WCMAPI.tenantCode + '/pageworkflowview?app_ecm_workflowview_detailsProcessInstanceID=' + numero : '',
                data: that.diaSolicitacao(r),
                solicitante: that.valorCampo(r, 'nomeSolicitante'),
                viajante: that.valorCampo(r, 'viajanteEhSolicitante') == 'N' ? that.valorCampo(r, 'nomeViajante') : that.valorCampo(r, 'nomeSolicitante'),
                destino: that.valorCampo(r, 'cidadeDestino'),
                ida: that.valorCampo(r, 'dataIda'),
                volta: that.valorCampo(r, 'dataVolta'),
                situacao: situacao.texto,
                classeSituacao: situacao.classe
            };
        });

        var template = $('.tpl-solicitacoes', this.DOM).html();
        $('#lista_' + this.instanceId).html(Mustache.render(template, { solicitacoes: solicitacoes }));
    },

    //dd/MM/yyyy -> yyyyMMdd, para comparar datas como texto
    dataOrdenavel: function(dia) {
        var p = dia.split('/');
        return p.length == 3 ? p[2] + p[1] + p[0] : '';
    },

    salvarConfig: function() {
        var nome = $.trim($('#datasetName_' + this.instanceId).val());
        WCMSpaceAPI.PageService.UPDATEPREFERENCES({
            async: true,
            success: function() {
                FLUIGC.toast({ message: 'Configuração salva.', type: 'success' });
            },
            fail: function(xhr, message, errorData) {
                FLUIGC.toast({ message: 'Erro ao salvar: ' + (errorData && errorData.message ? errorData.message : message), type: 'danger' });
            }
        }, this.instanceId, { datasetName: nome });
    },

    pad: function(n) {
        return n < 10 ? '0' + n : String(n);
    }

});
