<div id="DashViagem_${instanceId}" class="super-widget wcm-widget-class fluig-style-guide" data-params="DashViagem.instance({datasetName: '${datasetName!''}'})">
    <form role="form">
        <div class="form-group">
            <label for="datasetName_${instanceId}">Dataset do formulário "Solicitação Aprovação Viagem"</label>
            <input type="text" class="form-control" id="datasetName_${instanceId}" value="${datasetName!''}" placeholder="Automático"/>
            <p class="help-block">Deixe em branco para descobrir automaticamente pelo formulário 46 (Viagens &gt; ViagemAprovacao).</p>
        </div>
        <button type="button" class="btn btn-primary" data-salvar-config>Salvar</button>
    </form>
</div>
