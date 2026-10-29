<div id="DashViagem_${instanceId}" class="super-widget wcm-widget-class fluig-style-guide dash-viagem" data-params="DashViagem.instance({datasetName: '${datasetName!''}'})">
    <div class="panel panel-default">
        <div class="panel-heading clearfix">
            <h3 class="panel-title pull-left">Solicitações de viagem — últimos 30 dias</h3>
            <button type="button" class="btn btn-default btn-xs pull-right" data-atualizar title="Atualizar">
                <i class="fluigicon fluigicon-refresh icon-xs"></i> Atualizar
            </button>
        </div>
        <div class="panel-body">
            <div class="row dash-viagem-resumo">
                <div class="col-xs-4 text-center">
                    <div class="dash-viagem-valor" id="total_${instanceId}">-</div>
                    <div class="dash-viagem-rotulo">Total no período</div>
                </div>
                <div class="col-xs-4 text-center">
                    <div class="dash-viagem-valor" id="media_${instanceId}">-</div>
                    <div class="dash-viagem-rotulo">Média por dia</div>
                </div>
                <div class="col-xs-4 text-center">
                    <div class="dash-viagem-valor" id="hoje_${instanceId}">-</div>
                    <div class="dash-viagem-rotulo">Hoje</div>
                </div>
            </div>
            <div id="mensagem_${instanceId}"></div>
            <div id="grafico_${instanceId}" class="dash-viagem-grafico"></div>
        </div>
    </div>

    <div class="panel panel-default">
        <div class="panel-heading">
            <h3 class="panel-title">Últimas 20 solicitações</h3>
        </div>
        <div class="panel-body">
            <div id="lista_${instanceId}" class="table-responsive"></div>
        </div>
    </div>

    <script type="text/template" class="tpl-solicitacoes">
        {{#solicitacoes.length}}
        <table class="table table-striped table-condensed table-hover">
            <thead>
                <tr>
                    <th>Nº</th>
                    <th>Data</th>
                    <th>Solicitante</th>
                    <th>Viajante</th>
                    <th>Destino</th>
                    <th>Ida</th>
                    <th>Volta</th>
                    <th>Situação</th>
                </tr>
            </thead>
            <tbody>
                {{#solicitacoes}}
                <tr>
                    <td>{{#link}}<a href="{{link}}" target="_blank">{{numero}}</a>{{/link}}{{^link}}-{{/link}}</td>
                    <td>{{data}}</td>
                    <td>{{solicitante}}</td>
                    <td>{{viajante}}</td>
                    <td>{{destino}}</td>
                    <td>{{ida}}</td>
                    <td>{{volta}}</td>
                    <td><span class="label {{classeSituacao}}">{{situacao}}</span></td>
                </tr>
                {{/solicitacoes}}
            </tbody>
        </table>
        {{/solicitacoes.length}}
        {{^solicitacoes.length}}
        <div class="alert alert-info">Nenhuma solicitação encontrada.</div>
        {{/solicitacoes.length}}
    </script>
</div>
