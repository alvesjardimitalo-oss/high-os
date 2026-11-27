// HIGH OS — telas. As planilhas são só lidas, exceto no recolhimento (limpa a org na linha do Group).
import { esc, $, $$, moeda, pct, classeSeg, norm, toast, modal, confirmar, copiar } from './ui.js';
import { SEGMENTOS, IMAGENS_MN } from './dados.js';
import * as nuvem from './nuvem.js';
import { relatorioSemana, porSegmento, acompanhamento, csvSemana, HORARIOS } from './metricas.js';
import { avisoEntrega, avisoRecolhimento, corpoWebhook, webhookValida, beneficiosDaFaccao } from './avisos.js';
import { avisoPlanilha, carregarPlanilhas } from './app.js';

const semDados = (el) => {
  el.innerHTML = '<div class="painel vazio">Sem dados das planilhas ainda.</div>';
};
const cab = (sobre, titulo, texto = '', acoes = '') => `<div class="cab"><div><div class="sobre">${esc(sobre)}</div><h1>${esc(titulo)}</h1>${texto ? `<p>${texto}</p>` : ''}</div>${acoes ? `<div class="acoes">${acoes}</div>` : ''}</div>`;
const seloSituacao = (f) => !f.assumido ? '<span class="selo ciano">Disponível</span>' : f.completo ? '<span class="selo ok">Completo</span>' : '<span class="selo alerta">Cadastro pendente</span>';
const seloVip = (v) => `<span class="selo ${/META/i.test(v.aquisicao) ? 'acido' : ''}" title="${esc(v.aquisicao || '')}">${esc(v.nome)}</span>`;

/* ================= PAINEL ================= */
export function painel({ el, estado }) {
  const b = estado.base; if (!b) return semDados(el);
  const o = b.ocupacao;
  const pendentes = b.faccoes.filter((f) => f.assumido && !f.completo);
  const livres = b.faccoes.filter((f) => !f.assumido);
  const meta = b.faccoes.filter((f) => f.assumido && f.porMeta);
  el.innerHTML = cab('Visão geral', `Olá, ${estado.perfil.nome.split(' ')[0]}.`, `${o.assumidos} de ${o.total} groups estão com facção. ${livres.length ? livres.length + ' esperam dono.' : 'Nenhum group livre.'}`, '<a class="btn" href="#/avisos?tipo=entrega">Nova entrega</a><a class="btn sec" href="#/avisos?tipo=recolhimento">Recolhimento</a>') + `
    <div class="kpis">
      <div class="kpi acido"><span>Groups com facção</span><b>${o.assumidos}</b><small>de ${o.total} cadastrados</small></div>
      <div class="kpi ciano"><span>Groups disponíveis</span><b>${o.disponiveis}</b><small>prontos para entrega</small></div>
      <div class="kpi alerta"><span>Cadastros pendentes</span><b>${o.pendentes}</b><small>assumidos sem cadastro completo</small></div>
      <div class="kpi"><span>Contempladas por meta</span><b>${o.porMeta}</b><small>com VIP recebido por meta</small></div>
    </div>
    <div class="grade g-painel">
      <section class="painel"><h2>Ocupação por segmento</h2>
        <div class="ocup">
          <div class="anel" style="--p:${Math.round(o.ocupacao * 100)}"><div><b>${pct(o.ocupacao)}</b><small>ocupação</small></div></div>
          <div class="segs">${o.segmentos.map((s) => `<div class="seg-linha ${classeSeg(s.segmento)}"><b><span class="ponto-seg"></span>${esc(s.segmento)}</b>
            <div class="barra" title="${s.completos} completos · ${s.assumidos - s.completos} pendentes · ${s.disponiveis} livres"><i style="width:${(s.completos / s.groups) * 100}%"></i><i class="pend" style="width:${((s.assumidos - s.completos) / s.groups) * 100}%"></i></div>
            <span class="num muted">${s.assumidos}/${s.groups}</span></div>`).join('')}</div>
        </div>
        <p class="fraco" style="margin:14px 0 0;font-size:12px">Verde: cadastro completo · amarelo: assumido com cadastro pendente · vazio: group livre.</p>
      </section>
      <section class="painel"><h2>Groups livres <a class="btn peq fantasma" href="#/faccoes?situacao=livre">Ver todos</a></h2>
        <div class="lista">${livres.slice(0, 8).map((f) => `<a class="item-lista ${classeSeg(f.segmento)}" href="#/faccao/${encodeURIComponent(f.group)}"><span class="tag"><span class="ponto-seg"></span>${esc(f.group)}</span><span>${esc(f.qg)}</span><span class="fim selo ciano">Livre</span></a>`).join('') || '<div class="vazio">Todos os groups estão ocupados.</div>'}</div>
      </section>
    </div>
    <div class="grade g-2" style="margin-top:16px">
      <section class="painel"><h2>Cadastros pendentes <span class="selo alerta">${pendentes.length}</span></h2>
        <div class="lista">${pendentes.map((f) => `<a class="item-lista ${classeSeg(f.segmento)}" href="#/faccao/${encodeURIComponent(f.group)}"><span class="tag"><span class="ponto-seg"></span>${esc(f.group)}</span><b>${esc(f.faccao)}</b><span class="fim fraco">${esc(!f.lider ? 'sem líder' : !f.sublider ? 'sem sublíder' : 'status em aberto')}</span></a>`).join('') || '<div class="vazio">Nenhum cadastro pendente.</div>'}</div>
      </section>
      <section class="painel"><h2>Contempladas por meta <span class="selo acido">${meta.length}</span></h2>
        <div class="lista">${meta.map((f) => `<a class="item-lista ${classeSeg(f.segmento)}" href="#/faccao/${encodeURIComponent(f.group)}"><span class="tag"><span class="ponto-seg"></span>${esc(f.group)}</span><b>${esc(f.faccao)}</b><span class="fim">${f.vips.filter((v) => /META/i.test(v.aquisicao)).map(seloVip).join(' ')}</span></a>`).join('') || '<div class="vazio">Nenhuma facção por meta.</div>'}</div>
      </section>
    </div>`;
}

/* ================= FACÇÕES ================= */
const filtroFac = { busca: '', segmento: '', situacao: '' };
export function faccoes({ el, estado, params }) {
  const b = estado.base; if (!b) return semDados(el);
  if (params.get('situacao')) filtroFac.situacao = params.get('situacao');
  const desenhar = () => {
    const t = norm(filtroFac.busca);
    const lista = b.faccoes.filter((f) =>
      (!filtroFac.segmento || f.segmento === filtroFac.segmento)
      && (!filtroFac.situacao || (filtroFac.situacao === 'livre' ? !f.assumido : filtroFac.situacao === 'pendente' ? f.assumido && !f.completo : f.assumido))
      && (!t || norm([f.group, f.faccao, f.qg, f.lider].join(' ')).includes(t)));
    $('#cartoes', el).innerHTML = lista.map((f) => `<a class="fac ${classeSeg(f.segmento)} ${f.assumido ? '' : 'livre'}" href="#/faccao/${encodeURIComponent(f.group)}">
      <div class="topo-fac"><span class="grp">${esc(f.group)}</span>${seloSituacao(f)}</div>
      <div><h3>${esc(f.faccao || 'Group livre')}</h3><div class="qg">${esc(f.qg)}</div></div>
      ${f.vips.length ? `<div class="linha-vips">${f.vips.map(seloVip).join('')}</div>` : ''}
      <div class="rod"><span><span class="ponto-seg"></span>${esc(f.segmento)}</span><span>${esc(f.lider ? f.lider.split(' - ').slice(1).join(' - ') || f.lider : f.assumido ? 'sem líder' : '')}</span></div></a>`).join('') || '<div class="painel vazio" style="grid-column:1/-1">Nenhum group com esses filtros.</div>';
    $('#contagem', el).textContent = `${lista.length} de ${b.faccoes.length}`;
  };
  el.innerHTML = cab('Organizações', 'Facções e groups', 'Cadastro lido da planilha de facções. Toque num card para ver a ficha completa.') + `
    <div class="filtros">
      <input type="search" id="busca" placeholder="Buscar facção, group, QG ou líder" value="${esc(filtroFac.busca)}">
      <div class="pilulas" id="segs"><button data-seg="" class="${!filtroFac.segmento ? 'ativo' : ''}">Todos</button>${SEGMENTOS.map((s) => `<button data-seg="${esc(s)}" class="${filtroFac.segmento === s ? 'ativo' : ''}">${esc(s)}</button>`).join('')}</div>
      <div class="pilulas" id="sits">${[['', 'Qualquer situação'], ['assumido', 'Com facção'], ['pendente', 'Pendentes'], ['livre', 'Livres']].map(([v, r]) => `<button data-sit="${v}" class="${filtroFac.situacao === v ? 'ativo' : ''}">${r}</button>`).join('')}</div>
      <span class="fraco" id="contagem"></span>
    </div>
    <div class="cartoes" id="cartoes"></div>`;
  $('#busca', el).oninput = (e) => { filtroFac.busca = e.target.value; desenhar(); };
  $$('#segs button', el).forEach((bt) => bt.onclick = () => { filtroFac.segmento = bt.dataset.seg; $$('#segs button', el).forEach((x) => x.classList.toggle('ativo', x === bt)); desenhar(); });
  $$('#sits button', el).forEach((bt) => bt.onclick = () => { filtroFac.situacao = bt.dataset.sit; $$('#sits button', el).forEach((x) => x.classList.toggle('ativo', x === bt)); desenhar(); });
  desenhar();
}

/* ================= FICHA ================= */
export function ficha({ el, estado }, group) {
  const b = estado.base; if (!b) return semDados(el);
  const f = b.faccoes.find((x) => x.group === group);
  if (!f) { el.innerHTML = `<div class="aviso erro">Group ${esc(group)} não encontrado na planilha.</div><a class="btn sec" href="#/faccoes">Voltar</a>`; return; }
  const ben = f.beneficios, c = f.conferencia;
  const catalogo = (nome) => b.vips.find((v) => norm(v.produto) === norm(nome));
  const linha = (k, v) => `<dt>${esc(k)}</dt><dd>${v ? esc(v) : '<span class="fraco">—</span>'}</dd>`;
  el.innerHTML = `
    <section class="ficha-topo ${classeSeg(f.segmento)}">
      <a href="#/faccoes" class="fraco" style="text-decoration:none">← Facções</a>
      <div class="grp" style="margin-top:12px">${esc(f.group)} · ${esc(f.segmento)}</div>
      <h1>${esc(f.faccao || 'Group livre')}</h1>
      <div class="muted">${esc(f.qg)}</div>
      <div class="meta">${seloSituacao(f)}${f.garagemVip ? `<span class="selo">Garagem VIP ${esc(f.garagemVip.toLowerCase())}</span>` : ''}${f.condicaoVip && !/NÃO SE APLICA/i.test(f.condicaoVip) ? `<span class="selo alerta">${esc(f.condicaoVip)}</span>` : ''}</div>
      ${estado.perfil.staff ? `<div class="acoes">${f.assumido ? `<a class="btn sec" href="#/avisos?tipo=recolhimento&group=${encodeURIComponent(f.group)}">Recolher</a>` : ''}<a class="btn" href="#/avisos?tipo=entrega&group=${encodeURIComponent(f.group)}">${f.assumido ? 'Aviso de entrega' : 'Entregar group'}</a></div>` : ''}
    </section>
    <div class="grade g-2">
      <section class="painel"><h2>Liderança</h2><dl class="dados">${linha('Líder', f.lider)}${linha('Telefone', f.telLider)}${linha('Sublíder', f.sublider)}${linha('Telefone', f.telSublider)}${linha('Status', f.status)}</dl></section>
      <section class="painel"><h2>Benefícios no cadastro</h2><dl class="dados">${linha('Salário / 40 min', ben.salario)}${linha('Baú', ben.bau)}${linha('Rádio', ben.radio)}${linha('Chat', ben.chat)}${linha('Uniforme', ben.uniforme)}${linha('Rota exclusiva', ben.rota)}</dl></section>
    </div>
    <section class="painel" style="margin-top:16px"><h2>VIPs da facção <span class="fraco" style="font-size:13px">${f.vips.length} item(ns)</span></h2>
      ${f.vips.length ? `<div class="grade g-2">${f.vips.map((v) => { const cat = catalogo(v.nome); return `<div class="vip"><header><b>${esc(v.nome)}</b><span class="selo ${/META/i.test(v.aquisicao) ? 'acido' : ''}">${esc(v.aquisicao || '—')}</span></header><p>${esc(cat?.beneficios || 'Benefícios conforme cadastro e conferência.')}</p>${cat?.preco ? `<p class="fraco" style="margin-top:6px">Loja: ${esc(cat.preco)} · ${esc(cat.prazo || '')}</p>` : ''}</div>`; }).join('')}</div>` : '<div class="vazio">Sem VIP.</div>'}
    </section>
    <div class="grade g-2" style="margin-top:16px">
      <section class="painel"><h2>Conferência ${c?.pendencia ? '<span class="selo alerta">com pendência</span>' : ''}</h2>
        ${c ? `<div class="checks">${c.itens.map((i) => `<div class="check ${i.ok === true ? 'ok' : i.ok === false ? 'nao' : ''}"><i>${i.ok === true ? '✓' : i.ok === false ? '✕' : '–'}</i>${esc(i.nome)}</div>`).join('')}</div>
          ${c.pendencia ? `<div class="aviso alerta" style="margin:14px 0 0">${esc(c.pendencia)}</div>` : ''}
          ${c.cds.length ? `<h3 style="margin:16px 0 8px">Coordenadas anotadas</h3><div class="lista">${c.cds.map((x) => `<div class="item-lista"><span class="tag">${esc(x.campo)}</span><span class="mono">${esc(x.valor)}</span><button class="btn peq fantasma fim" data-copiar="${esc(x.valor)}">Copiar</button></div>`).join('')}</div>` : ''}`
          : '<div class="vazio">Group sem linha na conferência.</div>'}
      </section>
      <section class="painel"><h2>Histórico de aquisições</h2>
        ${f.historico.length ? `<div class="lista">${f.historico.map((h) => `<div class="item-lista"><span class="tag">${esc(h.data || 'sem data')}</span><span><b>${esc(h.item)}</b> <span class="fraco">· ${esc(h.aquisicao)} · ${esc(h.faccao)}</span>${h.obs ? `<br><small class="muted">${esc(h.obs)}</small>` : ''}</span>${h.valor ? `<span class="fim">${esc(h.valor)}</span>` : ''}</div>`).join('')}</div>` : '<div class="vazio">Nada registrado.</div>'}
      </section>
    </div>`;
  $$('[data-copiar]', el).forEach((bt) => bt.onclick = () => copiar(bt.dataset.copiar));
}

/* ================= CONFERÊNCIA ================= */
export function conferencia({ el, estado }) {
  const b = estado.base; if (!b) return semDados(el);
  const comConf = b.faccoes.filter((f) => f.conferencia);
  const nomes = comConf[0]?.conferencia.itens.map((i) => i.nome) || [];
  const falta = (f) => f.conferencia.itens.filter((i) => i.ok === false).length;
  el.innerHTML = cab('Checklist de entrega', 'Conferência', 'O que já foi conferido no jogo em cada group: craft, farm, baú, garagens, rota, rádio, chat, uniforme e salário.') + `
    <div class="kpis">
      <div class="kpi acido"><span>Groups conferidos</span><b>${comConf.filter((f) => f.conferencia.itens[0]?.ok).length}</b><small>de ${comConf.length}</small></div>
      <div class="kpi alerta"><span>Itens recusados</span><b>${comConf.reduce((s, f) => s + falta(f), 0)}</b><small>marcados como não</small></div>
      <div class="kpi"><span>Com pendência anotada</span><b>${comConf.filter((f) => f.conferencia.pendencia).length}</b></div>
    </div>
    <div class="tabela-caixa"><table class="matriz"><thead><tr><th>Group</th><th>Facção</th>${nomes.map((n) => `<th class="c">${esc(n)}</th>`).join('')}<th>Pendência</th></tr></thead>
    <tbody>${comConf.map((f) => `<tr class="${classeSeg(f.segmento)}"><td><a href="#/faccao/${encodeURIComponent(f.group)}" class="mono"><span class="ponto-seg"></span>${esc(f.group)}</a></td><td>${esc(f.faccao || '—')}</td>
      ${f.conferencia.itens.map((i) => `<td class="c"><span class="bola ${i.ok === true ? 'ok' : i.ok === false ? 'nao' : ''}" title="${esc(i.nome)}">${i.ok === true ? '✓' : i.ok === false ? '✕' : '·'}</span></td>`).join('')}
      <td class="muted">${esc(f.conferencia.pendencia || '')}</td></tr>`).join('')}</tbody></table></div>`;
}

/* ================= CATÁLOGO VIP ================= */
export function vips({ el, estado }) {
  const b = estado.base; if (!b) return semDados(el);
  const usos = (p) => b.faccoes.filter((f) => f.vips.some((v) => norm(v.nome) === norm(p))).length;
  el.innerHTML = cab('Loja', 'Catálogo de VIPs', 'Produtos da loja e o que cada um entrega. "Em uso" conta as facções que têm o item no cadastro.') + `
    <div class="vitrine">${b.vips.map((v) => `<article class="produto">
      <header style="display:flex;justify-content:space-between;gap:8px;align-items:start"><h3>${esc(v.produto)}</h3>${usos(v.produto) ? `<span class="selo acido">em uso · ${usos(v.produto)}</span>` : ''}</header>
      <div class="preco">${v.valor != null ? moeda(v.valor) : '<small>por meta / interno</small>'}${v.idLoja ? ` <small>· ID ${esc(v.idLoja)}</small>` : ''}</div>
      <p>${esc(v.beneficios)}</p><footer>${esc(v.prazo)}</footer></article>`).join('')}</div>`;
}

/* ================= ECONOMIA (catálogo do Mercado Negro) ================= */
let catEco = 0, buscaEco = '', inativosEco = false;
const SELO_STATUS = { inativo: ['', 'Inativo'], revisar: ['alerta', 'Em revisão'], indisponivel: ['erro', 'Indisponível'] };
export function economia({ el, estado }) {
  const b = estado.base; if (!b) return semDados(el);
  const m = b.mercado;
  const blocos = m.blocos;
  if (catEco >= blocos.length) catEco = 0;
  const visivel = (i) => inativosEco || i.status !== 'inativo';
  const ativos = (bl) => bl.itens.filter((i) => i.status !== 'inativo').length;
  const quando = m.atualizadoEm ? new Date(m.atualizadoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '';
  const linha = (i) => `<tr class="${i.status === 'inativo' ? 'apagado' : ''}">
    <td><div class="item-eco">${i.imagem ? `<img src="${esc(IMAGENS_MN + i.imagem)}" alt="" loading="lazy" data-img>` : '<span class="sem-img"></span>'}
      <div><b>${esc(i.nome)}</b>${i.destaque ? ' <span class="selo acido">Destaque</span>' : ''}${SELO_STATUS[i.status] ? ` <span class="selo ${SELO_STATUS[i.status][0]}">${SELO_STATUS[i.status][1]}</span>` : ''}${i.obs ? `<br><small class="muted">${esc(i.obs)}</small>` : ''}</div></div></td>
    <td class="num">${i.parceria != null ? moeda(i.parceria) : '<span class="fraco">a definir</span>'}</td>
    <td class="num">${i.pista != null ? moeda(i.pista) : '<span class="fraco">a definir</span>'}${i.parceria && i.pista ? `<span class="dif">+${Math.round((i.pista / i.parceria - 1) * 100)}%</span>` : ''}</td></tr>`;
  const desenhar = () => {
    const t = norm(buscaEco);
    const alvo = (t ? blocos.map((bl) => ({ ...bl, itens: bl.itens.filter((i) => norm(i.nome).includes(t)) })) : [blocos[catEco]].filter(Boolean))
      .map((bl) => ({ ...bl, itens: bl.itens.filter(visivel) })).filter((bl) => bl.itens.length || bl.regras.length);
    $('#eco', el).innerHTML = alvo.map((bl) => `<section class="painel" style="margin-bottom:14px"><h2>${esc(bl.categoria)} <span class="fraco" style="font-size:13px">${bl.itens.length} itens</span></h2>
      ${bl.itens.length ? `<div class="tabela-caixa"><table><thead><tr><th>Item</th><th class="num">Valor parceria</th><th class="num">Valor pista</th></tr></thead><tbody>${bl.itens.map(linha).join('')}</tbody></table></div>` : ''}
      ${bl.regras.length ? `<div class="regras">${bl.regras.map((r) => `<div class="aviso" style="margin:0">${esc(r)}</div>`).join('')}</div>` : ''}</section>`).join('') || '<div class="painel vazio">Nenhum item encontrado.</div>';
    // imagem que não existe no site do Mercado Negro vira o quadrado vazio
    $$('img[data-img]', el).forEach((img) => img.addEventListener('error', () => { const s = document.createElement('span'); s.className = 'sem-img'; img.replaceWith(s); }, { once: true }));
  };
  el.innerHTML = cab('Mercado Negro', 'Economia', `Preços do catálogo do Mercado Negro${quando ? ` · atualizado em ${esc(quando)}` : ''}${m.publicadoPor ? ` por ${esc(m.publicadoPor)}` : ''}.`, '<a class="btn sec" href="https://alvesjardimitalo-oss.github.io/high-mercado-negro/index.html" target="_blank" rel="noopener">Abrir o site</a>') + `
    <div class="filtros"><input type="search" id="busca-eco" placeholder="Buscar item em todas as categorias" value="${esc(buscaEco)}">
      <label style="display:flex;gap:8px;align-items:center;color:var(--texto-2)"><input type="checkbox" id="inativos-eco" style="width:auto;min-height:0" ${inativosEco ? 'checked' : ''}> Mostrar inativos</label></div>
    <div class="categorias" id="cats">${blocos.map((bl, i) => `<button data-i="${i}" class="${i === catEco && !buscaEco ? 'ativo' : ''}">${esc(bl.categoria)}<small>${ativos(bl)} ativos · ${bl.itens.length} no total</small></button>`).join('')}</div>
    <div id="eco"></div>`;
  $('#busca-eco', el).oninput = (e) => { buscaEco = e.target.value; $$('#cats button', el).forEach((x) => x.classList.toggle('ativo', !buscaEco && +x.dataset.i === catEco)); desenhar(); };
  $('#inativos-eco', el).onchange = (e) => { inativosEco = e.target.checked; desenhar(); };
  $$('#cats button', el).forEach((bt) => bt.onclick = () => { catEco = +bt.dataset.i; buscaEco = ''; $('#busca-eco', el).value = ''; $$('#cats button', el).forEach((x) => x.classList.toggle('ativo', x === bt)); desenhar(); });
  desenhar();
}

/* ================= ENTREGAS E RECOLHIMENTOS ================= */
export async function avisos({ el, estado, params }) {
  const b = estado.base;
  const podeEnviar = estado.perfil.staff;
  let tipo = params.get('tipo') === 'recolhimento' ? 'recolhimento' : 'entrega';
  let webhooks = {};
  try { webhooks = await nuvem.lerWebhooks(); } catch { webhooks = {}; }
  const hoje = new Date();
  const dataBR = hoje.toLocaleDateString('pt-BR'), horaBR = hoje.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const groups = b?.faccoes || [];
  const pre = groups.find((f) => f.group === params.get('group'));

  el.innerHTML = cab('Discord · Ilegal', 'Entregas e recolhimentos', 'Monte o aviso, confira a prévia e publique direto no canal pela webhook. Cada envio fica registrado aqui embaixo.') + `
    <div class="grade g-2">
      <section class="painel">
        <div class="tipo-aviso"><button data-tipo="entrega">Entrega de organização<small>Group passa para uma facção</small></button><button data-tipo="recolhimento">Recolhimento<small>Facção deixa o group</small></button></div>
        <form id="form-aviso" autocomplete="off">
          <label class="campo"><span>Group</span><select name="group"><option value="">Selecione</option>${groups.map((f) => `<option value="${esc(f.group)}" ${pre?.group === f.group ? 'selected' : ''}>${esc(f.group)} · ${esc(f.faccao || 'livre')} — ${esc(f.qg)}</option>`).join('')}</select></label>
          <div id="campos"></div>
          ${podeEnviar ? '' : '<div class="aviso alerta">Seu perfil é de consulta: você pode montar e copiar, mas não publicar.</div>'}
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">
            <button class="btn" type="submit" ${podeEnviar ? '' : 'disabled'}>Publicar no Discord</button>
            <button class="btn sec" type="button" data-copiar-texto>Copiar texto</button>
          </div>
        </form>
      </section>
      <section class="painel"><h2>Prévia no Discord</h2><div id="previa"></div><p class="fraco" id="destino" style="font-size:12px;margin:10px 0 0"></p></section>
    </div>
    <section class="painel" style="margin-top:16px"><h2>Últimos avisos publicados</h2><div id="historico" class="lista"><div class="vazio">Carregando…</div></div></section>`;

  const form = $('#form-aviso', el);
  const camposEntrega = (f) => `
    <div class="grade g-2" style="gap:0 12px">
      <label class="campo"><span>Facção</span><input name="faccao" value="${esc(f?.faccao || '')}" placeholder="Nome da facção"></label>
      <label class="campo"><span>Líder (ID - nome)</span><input name="lider" value="${esc(f?.lider || '')}"></label>
      <label class="campo"><span>Staff responsável</span><input name="responsavel" value="${esc(estado.perfil.nome)}"></label>
      <label class="campo"><span>Data</span><input name="data" value="${esc(dataBR)}"></label>
    </div>
    <label class="campo"><span>Oferta</span><input name="oferta" placeholder="O que foi oferecido para a org ficar"></label>
    <label class="campo"><span>Meta de recrutamento</span><input name="metaRec" placeholder="Ex.: 10 recs por semana"></label>
    <label class="campo"><span>Observação</span><input name="observacao" placeholder="Vip Org Ultra caso bater a meta."></label>
    <label class="campo"><span>Benefícios entregues (um por linha)</span><textarea name="beneficios" rows="5">${esc(beneficiosDaFaccao(f).join('\n'))}</textarea></label>`;
  const camposRecolhimento = (f) => `
    <div class="grade g-2" style="gap:0 12px">
      <label class="campo"><span>Facção recolhida</span><input name="faccao" value="${esc(f?.faccao || '')}"></label>
      <label class="campo"><span>Líder (ID - nome)</span><input name="lider" value="${esc(f?.lider || '')}"></label>
      <label class="campo"><span>Data</span><input name="data" value="${esc(dataBR)}"></label>
      <label class="campo"><span>Hora</span><input name="hora" value="${esc(horaBR)}"></label>
    </div>
    <label class="campo"><span>Motivo</span><input name="motivo" placeholder="Ex.: Solicitação da liderança"></label>
    <label class="campo"><span>Justificativa</span><input name="justificativa" placeholder="Ex.: Líder desistiu"></label>
    <label class="campo"><span>Responsável</span><input name="responsavel" value="${esc(estado.perfil.nome)}"></label>
    <label class="campo"><span>Status final</span><input name="statusFinal" placeholder="Facção vazia."></label>`;
  const faccaoSel = () => groups.find((f) => f.group === form.group.value);
  const dados = () => {
    const d = Object.fromEntries(new FormData(form).entries());
    const f = faccaoSel();
    return { ...d, local: f?.qg || '', segmento: f?.segmento || '' };
  };
  const aviso = () => (tipo === 'entrega' ? avisoEntrega : avisoRecolhimento)(dados());
  const previa = () => {
    const a = aviso();
    $('#previa', el).innerHTML = `<div class="previa"><h4>${esc(a.embed.title)}</h4><pre>${esc(a.embed.description)}</pre><img src="${esc(a.embed.image.url)}" alt=""><footer>${esc(a.embed.footer.text)}</footer></div>`;
    const url = webhooks[tipo];
    $('#destino', el).innerHTML = url ? `Vai para a webhook de <b>${tipo === 'entrega' ? 'entregas' : 'recolhimentos'}</b> configurada.` : `<span style="color:var(--alerta)">Webhook de ${tipo === 'entrega' ? 'entregas' : 'recolhimentos'} não configurada.</span> ${estado.perfil.admin ? '<a href="#/config">Configurar</a>' : 'Peça ao administrador.'}`;
  };
  const trocarTipo = (t) => {
    tipo = t;
    $$('.tipo-aviso button', el).forEach((x) => x.classList.toggle('ativo', x.dataset.tipo === t));
    $('#campos', el).innerHTML = t === 'entrega' ? camposEntrega(faccaoSel()) : camposRecolhimento(faccaoSel());
    previa();
  };
  $$('.tipo-aviso button', el).forEach((bt) => bt.onclick = () => trocarTipo(bt.dataset.tipo));
  form.group.onchange = () => trocarTipo(tipo);
  form.oninput = previa;
  $('[data-copiar-texto]', el).onclick = () => copiar(aviso().texto);
  form.onsubmit = async (e) => {
    e.preventDefault();
    if (!form.group.value) return toast('Escolha o group.', 'erro');
    const url = webhooks[tipo];
    if (!webhookValida(url)) return toast('A webhook deste aviso não está configurada.', 'erro');
    const d = dados();
    const recolher = tipo === 'recolhimento';
    const pergunta = `Publicar o aviso de ${tipo} do ${d.group}${d.faccao ? ' (' + d.faccao + ')' : ''} no Discord?`
      + (recolher ? ` Também vai limpar na planilha os dados da org do ${d.group}: ASSUMIDO vira NÃO, STATUS vira DISPONÍVEL e saem facção, líder e sublíder. Group, QG, VIPs e benefícios ficam como estão.` : '');
    if (!(await confirmar(pergunta, { ok: 'Publicar' }))) return;
    const bt = form.querySelector('[type=submit]'); bt.disabled = true;
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpoWebhook(aviso())) });
      if (!r.ok) throw new Error('O Discord recusou (HTTP ' + r.status + ').');
      // Recolhimento: o Group fica livre na hora — limpa a org na planilha logo depois do aviso.
      let planilha = null, erroPlanilha = '';
      if (recolher) {
        try { planilha = await nuvem.limparOrgNaPlanilha(d.group); } catch (err) { erroPlanilha = err.message || String(err); }
      }
      await nuvem.registrarAviso({
        tipo, group: d.group, faccao: d.faccao || '', segmento: d.segmento, dados: d,
        ...(recolher ? { planilhaLimpa: !erroPlanilha, planilhaErro: erroPlanilha, planilhaAntes: planilha?.celulas?.map((c) => ({ coluna: c.coluna, valor: c.antes })) || [] } : {}),
      }).catch(() => {});
      if (!recolher) toast('Aviso publicado no Discord.');
      else if (erroPlanilha) toast(`Aviso publicado, mas a planilha NÃO foi limpa: ${erroPlanilha} Limpe a linha do ${d.group} à mão (ASSUMIDO = NÃO, STATUS = DISPONÍVEL, sem facção/líder/sublíder).`, 'erro');
      else {
        toast(planilha?.jaLivre ? `Aviso publicado. O ${d.group} já estava livre na planilha.` : `Aviso publicado e org do ${d.group} limpa na planilha (linha ${planilha.linha}).`);
        await carregarPlanilhas({ silencioso: true });
      }
      carregarHistorico();
    } catch (err) { toast('Não foi publicado: ' + (err.message || err), 'erro'); }
    bt.disabled = !podeEnviar;
  };
  async function carregarHistorico() {
    try {
      const l = await nuvem.ultimosAvisos();
      $('#historico', el).innerHTML = l.map((a) => `<div class="item-lista"><span class="selo ${a.tipo === 'entrega' ? 'acido' : 'alerta'}">${a.tipo === 'entrega' ? 'Entrega' : 'Recolhimento'}</span><span class="tag">${esc(a.group)}</span><b>${esc(a.faccao || '')}</b><span class="fim fraco">${a.em ? a.em.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : ''} · ${esc(a.por || '')}</span></div>`).join('') || '<div class="vazio">Nenhum aviso publicado pelo High OS ainda.</div>';
    } catch { $('#historico', el).innerHTML = '<div class="vazio">Não consegui ler o histórico.</div>'; }
  }
  trocarTipo(tipo);
  carregarHistorico();
}

/* ================= MÉTRICAS ================= */
// Relatório semanal feito sobre os dados do metricas.highrp.net (gravados pelo coletor/).
const estMet = { aba: 'semana', semana: '', busca: '', seg: '', ordem: 'posicao', dir: 1, acomp: 'pico', dia: '' };
const fNum = (v, casas = 1) => (v == null ? '—' : Number(v).toLocaleString('pt-BR', { maximumFractionDigits: casas }));
const fPct = (v) => (v == null ? '—' : Math.round(v * 100) + '%');
const fDia = (d) => (d ? d.split('-').reverse().slice(0, 2).join('/') : '—');
const DIAS_SEM = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const diaSemana = (d) => (d ? DIAS_SEM[new Date(d + 'T12:00:00Z').getUTCDay()] : '');
const rotuloSemana = (s) => `${fDia(s.de)} a ${fDia(s.ate)}`;
/** Variação colorida: absoluta (pico) ou percentual. */
const seta = (v, { pct: emPct = false, neutro = 0 } = {}) => {
  if (v == null) return '<span class="fraco">—</span>';
  const txt = emPct ? `${v > 0 ? '+' : ''}${Math.round(v * 100)}%` : `${v > 0 ? '+' : ''}${fNum(v)}`;
  if (Math.abs(v) <= neutro) return `<span class="fraco">${emPct ? '0%' : '='}</span>`;
  return `<span class="${v > 0 ? 'ok-txt' : 'erro-txt'}">${v > 0 ? '▲' : '▼'} ${txt}</span>`;
};
const setaPos = (o) => {
  if (o.posicaoAnt == null) return '<span class="selo ciano" style="font-size:10px">novo</span>';
  const d = o.posicaoAnt - o.posicao;
  return d === 0 ? '<span class="fraco">=</span>' : `<span class="${d > 0 ? 'ok-txt' : 'erro-txt'}">${d > 0 ? '▲' : '▼'}${Math.abs(d)}</span>`;
};

export async function metricas({ el, estado }) {
  const titulo = (txt = '') => cab('Relatório semanal · metricas.highrp.net', 'Métricas', txt || 'Presença das organizações do Ilegal, semana a semana.');
  el.innerHTML = titulo() + '<div class="painel vazio">Carregando métricas…</div>';
  let atual, dias, semanas;
  try { [atual, dias, semanas] = await Promise.all([nuvem.lerMetricas(), nuvem.diasMetricas(60), nuvem.semanasMetricas()]); }
  catch (e) { el.innerHTML = titulo() + `<div class="painel vazio">Não consegui ler as métricas: ${esc(e.message)}</div>`; return; }
  if (!semanas.length) {
    el.innerHTML = titulo() + '<div class="painel vazio"><h2 style="margin-bottom:8px">Aguardando o coletor</h2>Nenhuma semana gravada ainda. No computador do administrador, use o atalho <b>High OS - Coletar métricas agora</b>.</div>';
    return;
  }

  // Nome da facção e segmento vêm da planilha; a API só conhece o Group (Armas01, Lavagem06…).
  const porGroup = new Map((estado.base?.faccoes || []).map((f) => [norm(f.group), f]));
  const familia = new Map((atual?.catalogo || []).map((g) => [norm(g.group), g.familia]));
  const nomeFac = (org) => porGroup.get(norm(org))?.faccao || '';
  const segOrg = (org) => porGroup.get(norm(org))?.segmento || familia.get(norm(org)) || 'Outros';
  const linkOrg = (org) => porGroup.has(norm(org)) ? `<a href="#/faccao/${encodeURIComponent(porGroup.get(norm(org)).group)}"><b>${esc(org)}</b></a>` : `<b>${esc(org)}</b>`;
  const celOrg = (org) => `<td class="${classeSeg(segOrg(org))}"><span class="ponto-seg"></span> ${linkOrg(org)}${nomeFac(org) ? `<br><small class="fraco">${esc(nomeFac(org))}</small>` : ''}</td>`;

  const lido = atual?.lidoEm ? new Date(atual.lidoEm) : null;
  const c = atual?.coletor || {};
  const avisoColetor = c.status === 'sessao'
    ? '<div class="aviso erro"><div><b>A sessão do Discord do coletor expirou.</b><br>No computador do administrador, abra o atalho <b>High OS - Login do coletor (Discord)</b> e entre de novo. Os números abaixo são da última leitura boa.</div></div>'
    : c.status === 'erro' ? `<div class="aviso erro"><div><b>A última coleta falhou.</b><br>${esc(c.erro || '')}</div></div>`
      : !lido || (Date.now() - lido) / 3600000 > 8 ? '<div class="aviso alerta"><div><b>Leitura antiga.</b> O coletor não grava há mais de 8 horas. Confira se o computador do administrador ficou ligado.</div></div>' : '';

  if (!semanas.some((s) => s.de === estMet.semana)) estMet.semana = semanas[semanas.length - 1].de;
  let rel = null;

  /* ---------- aba SEMANA ---------- */
  const abaSemana = () => {
    rel = relatorioSemana(semanas, dias, estMet.semana, segOrg);
    const g = rel.global, s = rel.semana, ant = rel.anterior;
    const aviso = s.inicioAcompanhamento ? '<div class="aviso alerta"><div><b>Semana de início do acompanhamento.</b> O site começou a medir no meio desta semana; os números são parciais e não servem para comparar.</div></div>'
      : s.parcial ? `<div class="aviso"><div><b>Semana em andamento.</b> Pico e ativos ainda podem subir até domingo. A comparação é com a semana de ${ant ? rotuloSemana(ant) : '—'} inteira.</div></div>` : '';
    const t = norm(estMet.busca);
    const k = estMet.ordem;
    const val = (o) => (/^h\d\d$/.test(k) ? o.horarios[k.slice(1)] : o[k]) ?? -Infinity;
    const lista = rel.organizacoes
      .filter((o) => (!estMet.seg || o.segmento === estMet.seg) && (!t || norm([o.org, nomeFac(o.org), o.segmento].join(' ')).includes(t)))
      .sort((a, b) => (k === 'org' ? a.org.localeCompare(b.org, 'pt-BR', { numeric: true }) : val(a) > val(b) ? 1 : val(a) < val(b) ? -1 : 0) * estMet.dir || a.posicao - b.posicao);
    const maxDia = Math.max(1, ...s.dias.map((d) => d.pico));
    const segs = porSegmento(rel.organizacoes);
    const th = (k, txt, cls = 'num', dica = '') => `<th class="${cls}" data-ord="${k}" title="${esc(dica)}" style="cursor:pointer">${txt}${estMet.ordem === k ? (estMet.dir > 0 ? ' ↑' : ' ↓') : ''}</th>`;
    const itemDest = (o, campo) => `<div class="item-lista"><span>${linkOrg(o.org)}</span><span class="fim">${campo(o)}</span></div>`;
    return aviso + `
      <div class="kpis">
        <div class="kpi acido"><span>Pico global da semana</span><b>${fNum(g.pico)}</b><small>${g.diaDoPico ? `${diaSemana(g.diaDoPico)} ${fDia(g.diaDoPico)} · ` : ''}${seta(g.deltaPico)} vs. semana anterior</small></div>
        <div class="kpi ciano"><span>Média simultânea online</span><b>${fNum(g.mediaOnline)}</b><small>${seta(g.deltaMedia, { pct: true })} · presença real, não só o pico</small></div>
        <div class="kpi"><span>Membros ativos</span><b>${fNum(g.ativos)}</b><small>${fPct(g.taxaAtividade)} dos ${fNum(g.membros)} membros · ${seta(g.deltaAtivos, { pct: true })}</small></div>
        <div class="kpi alerta"><span>Organizações com presença</span><b>${g.orgsComPresenca}<small style="font-size:18px"> / ${rel.organizacoes.length}</small></b><small>${rel.destaques.semPresenca.length ? rel.destaques.semPresenca.length + ' sem ninguém na semana' : 'todas apareceram'}</small></div>
      </div>
      <div class="grade g-2" style="margin-bottom:16px">
        <section class="painel"><h2>Pico global por dia <span class="fraco" style="font-size:12px;font-weight:500">${rotuloSemana(s)}</span></h2>
          <div class="met-serie">${s.dias.map((d) => `<div class="met-col ${d.parcial ? 'parcial' : ''} ${d.dia === g.diaDoPico ? 'topo' : ''}" title="${fDia(d.dia)} · pico ${d.pico} · ${fNum(d.horasOnline, 0)} h online"><small>${d.pico}</small><i style="height:${(d.pico / maxDia) * 100}%"></i><span>${diaSemana(d.dia)} ${fDia(d.dia)}</span></div>`).join('')}</div>
        </section>
        <section class="painel"><h2>Por segmento</h2>
          <div class="tabela-caixa" style="border:0"><table><thead><tr><th>Segmento</th><th class="num" title="Soma da média simultânea das organizações">Média simult.</th><th class="num">Ativos</th><th>Maior pico</th></tr></thead>
          <tbody>${segs.map((x) => `<tr class="${classeSeg(x.segmento)}"><td><span class="ponto-seg"></span> <b>${esc(x.segmento)}</b> <small class="fraco">${x.organizacoes} org.</small></td><td class="num">${fNum(x.mediaOnline)}</td><td class="num">${fNum(x.ativos)} <small class="fraco">${fPct(x.membros ? x.ativos / x.membros : null)}</small></td><td>${x.melhor ? `${esc(x.melhor.org)} <small class="fraco">${x.melhor.pico}</small>` : '—'}</td></tr>`).join('')}</tbody></table></div>
        </section>
      </div>
      <div class="grade g-3 met-destaques" style="margin-bottom:16px">
        <section class="painel"><h2>Maiores altas de pico</h2><div class="lista">${rel.destaques.altas.map((o) => itemDest(o, (x) => `${x.picoAnt} → <b>${x.pico}</b> ${seta(x.deltaPico)}`)).join('') || '<div class="vazio">Nenhuma alta.</div>'}</div></section>
        <section class="painel"><h2>Maiores quedas de pico</h2><div class="lista">${rel.destaques.quedas.map((o) => itemDest(o, (x) => `${x.picoAnt} → <b>${x.pico}</b> ${seta(x.deltaPico)}`)).join('') || '<div class="vazio">Nenhuma queda.</div>'}</div></section>
        <section class="painel"><h2>Pede atenção</h2><div class="lista">
          ${rel.destaques.semPresenca.length ? `<div class="item-lista"><span><b>Sem presença:</b> ${rel.destaques.semPresenca.map(esc).join(', ')}</span></div>` : ''}
          ${rel.destaques.baixaAtividade.filter((o) => o.pico > 0).slice(0, 6).map((o) => itemDest(o, (x) => `${x.ativos} de ${x.membros} ativos · <b class="erro-txt">${fPct(x.taxaAtividade)}</b>`)).join('')}
          ${!rel.destaques.semPresenca.length && !rel.destaques.baixaAtividade.length ? '<div class="vazio">Nada fora do normal.</div>' : ''}</div>
          <p class="fraco" style="font-size:11.5px;margin:10px 0 0">Baixa atividade: menos de 40% dos membros entraram na semana.</p></section>
      </div>
      <div class="filtros">
        <input type="search" id="met-busca" placeholder="Buscar group, facção ou segmento" value="${esc(estMet.busca)}">
        <div class="pilulas" id="met-segs"><button data-seg="" class="${!estMet.seg ? 'ativo' : ''}">Todos</button>${segs.map((x) => `<button data-seg="${esc(x.segmento)}" class="${estMet.seg === x.segmento ? 'ativo' : ''}">${esc(x.segmento)}</button>`).join('')}</div>
        <span class="fraco">${lista.length} de ${rel.organizacoes.length}</span>
      </div>
      <div class="tabela-caixa"><table class="met-tabela"><thead><tr>
        ${th('posicao', '#', 'num', 'Posição no ranking de pico')}<th></th>${th('org', 'Group / facção', '')}
        ${th('pico', 'Pico', 'num', 'Maior número de membros online ao mesmo tempo na semana')}${th('deltaPico', 'vs. ant.', 'num', 'Diferença de pico para a semana anterior')}
        ${th('mediaOnline', 'Média simult.', 'num', 'Média de membros online ao mesmo tempo, a semana toda')}${th('mediaPicoDiario', 'Média do pico diário', 'num', 'Média dos picos de cada dia: mostra se o pico foi um dia isolado')}
        ${th('ativos', 'Ativos', 'num', 'Membros que entraram pelo menos uma vez na semana')}${th('taxaAtividade', 'Atividade', 'num', 'Ativos ÷ membros')}
        ${th('horasPorAtivo', 'Horas / ativo', 'num', 'Tempo médio online de cada membro ativo')}${th('diasComPresenca', 'Dias', 'num', 'Dias da semana com alguém online')}
        ${HORARIOS.map((h) => th('h' + h, h + 'h', 'num', `Pico médio às ${h}h nos dias da semana`)).join('')}
      </tr></thead><tbody>${lista.map((o) => `<tr>
        <td class="num"><b>${o.posicao}</b></td><td class="num">${setaPos(o)}</td>${celOrg(o.org)}
        <td class="num"><b>${fNum(o.pico)}</b>${o.diaDoPico ? `<br><small class="fraco">${diaSemana(o.diaDoPico)}</small>` : ''}</td><td class="num">${seta(o.deltaPico)}</td>
        <td class="num">${fNum(o.mediaOnline)}<br><small>${seta(o.deltaMedia, { pct: true, neutro: 0.02 })}</small></td><td class="num">${fNum(o.mediaPicoDiario)}</td>
        <td class="num">${fNum(o.ativos)}<small class="fraco"> / ${fNum(o.membros)}</small></td>
        <td class="num"><div class="met-taxa" title="${fPct(o.taxaAtividade)}"><i style="width:${Math.round((o.taxaAtividade || 0) * 100)}%" class="${(o.taxaAtividade ?? 1) < 0.4 ? 'baixa' : ''}"></i></div><small>${fPct(o.taxaAtividade)}</small></td>
        <td class="num">${fNum(o.horasPorAtivo)} h</td><td class="num">${o.diasMedidos ? `${o.diasComPresenca}/${o.diasMedidos}` : '—'}</td>
        ${HORARIOS.map((h) => `<td class="num">${fNum(o.horarios[h])}</td>`).join('')}</tr>`).join('') || '<tr><td colspan="15" class="vazio">Nenhuma organização com esse filtro.</td></tr>'}</tbody></table></div>
      <p class="fraco" style="font-size:12px;margin:10px 0 0">Dias, média do pico diário e horários 14h/16h/21h/23h dependem do histórico diário gravado pelo coletor; os horários só existem a partir de 26/11.</p>`;
  };

  /* ---------- aba ACOMPANHAMENTO ---------- */
  const abaAcomp = () => {
    const a = acompanhamento(semanas);
    const m = estMet.acomp;
    const rot = { pico: 'Pico', mediaOnline: 'Média simultânea', ativos: 'Membros ativos' }[m];
    const maxG = Math.max(1, ...a.semanas.map((s) => s.global.pico));
    const ult = a.semanas.length - 1;
    const linhas = [...a.linhas].sort((x, y) => (y.valores[ult]?.[m] ?? -1) - (x.valores[ult]?.[m] ?? -1) || x.org.localeCompare(y.org, 'pt-BR', { numeric: true }));
    const maxV = Math.max(1, ...linhas.flatMap((l) => l.valores.map((v) => v?.[m] || 0)));
    return `
      <section class="painel" style="margin-bottom:16px"><h2>Global semana a semana</h2>
        <div class="tabela-caixa" style="border:0"><table><thead><tr><th>Semana</th><th class="num">Pico global</th><th></th><th>Dia do pico</th><th class="num">Média simult.</th><th class="num">Ativos</th><th class="num">Horas online</th></tr></thead>
        <tbody>${a.semanas.map((s, k) => { const p = a.semanas[k - 1]; return `<tr><td><b>${rotuloSemana(s)}</b>${s.parcial ? ' <span class="selo alerta">em andamento</span>' : ''}${s.inicio ? ' <span class="selo">início</span>' : ''}</td>
          <td class="num"><b>${fNum(s.global.pico)}</b> ${p && !p.inicio ? seta(s.global.pico - p.global.pico) : ''}</td><td style="width:28%"><div class="met-taxa larga"><i style="width:${(s.global.pico / maxG) * 100}%"></i></div></td>
          <td>${s.global.diaDoPico ? `${diaSemana(s.global.diaDoPico)} ${fDia(s.global.diaDoPico)}` : '—'}</td><td class="num">${fNum(s.global.mediaOnline)}</td><td class="num">${fNum(s.global.ativos)}</td><td class="num">${fNum(s.global.horasOnline, 0)}</td></tr>`; }).join('')}</tbody></table></div>
      </section>
      <div class="filtros"><div class="pilulas" id="met-acomp">${[['pico', 'Pico'], ['mediaOnline', 'Média simultânea'], ['ativos', 'Membros ativos']].map(([v, r]) => `<button data-m="${v}" class="${m === v ? 'ativo' : ''}">${r}</button>`).join('')}</div>
        <span class="fraco">${rot} de cada organização por semana. Ordenado pela semana mais recente.</span></div>
      <div class="tabela-caixa"><table class="met-matriz"><thead><tr><th>Group / facção</th>${a.semanas.map((s) => `<th class="num">${fDia(s.de)}<br><small class="fraco">a ${fDia(s.ate)}</small></th>`).join('')}<th class="num">Tendência</th></tr></thead>
        <tbody>${linhas.map((l) => {
          const vals = l.valores.map((v) => v?.[m] ?? null);
          const comp = a.semanas.map((s, k) => (s.inicio ? null : vals[k])).filter((v) => v != null);
          const tend = comp.length >= 2 ? comp[comp.length - 1] - comp[comp.length - 2] : null;
          return `<tr>${celOrg(l.org)}${vals.map((v, k) => `<td class="num met-calor" style="--q:${v == null ? 0 : (v / maxV).toFixed(2)}">${fNum(v)}${a.semanas[k].parcial ? '<small class="fraco">*</small>' : ''}</td>`).join('')}<td class="num">${seta(tend)}</td></tr>`;
        }).join('')}</tbody></table></div>
      <p class="fraco" style="font-size:12px;margin:10px 0 0">* semana em andamento. A semana de início do acompanhamento não entra na tendência.</p>`;
  };

  /* ---------- aba POR DIA ---------- */
  const abaDia = () => {
    if (!dias.length) return '<div class="painel vazio">O histórico por dia começa a encher na primeira coleta.</div>';
    const d = dias.find((x) => x.dia === estMet.dia) || dias[0];
    estMet.dia = d.dia;
    const linhas = Object.entries(d.organizacoes || {}).filter(([, o]) => o.pico || Object.values(o.horas || {}).some((h) => h.pico)).sort((a, b) => (b[1].pico || 0) - (a[1].pico || 0));
    const celHora = (o, h) => { const x = o.horas?.[h]; return x ? `${fNum(x.pico)}<small class="fraco"> · ${fNum(x.media)}</small>` : '<span class="fraco">—</span>'; };
    return `<div class="filtros"><label class="campo" style="margin:0;max-width:220px"><span>Dia</span><select id="met-sel-dia">${dias.map((x) => `<option value="${esc(x.dia)}" ${x.dia === d.dia ? 'selected' : ''}>${diaSemana(x.dia)} ${esc(x.dia.split('-').reverse().join('/'))}</option>`).join('')}</select></label></div>
      <div class="tabela-caixa"><table><thead><tr><th>Group / facção</th><th class="num">Média do dia</th><th class="num">Pico do dia</th>${HORARIOS.map((h) => `<th class="num">${h}h</th>`).join('')}</tr></thead>
      <tbody>${linhas.map(([org, o]) => `<tr>${celOrg(org)}<td class="num">${fNum(o.media)}</td><td class="num"><b>${fNum(o.pico)}</b></td>${HORARIOS.map((h) => `<td class="num">${celHora(o, h)}</td>`).join('')}</tr>`).join('') || '<tr><td colspan="7" class="vazio">Sem presença registrada neste dia.</td></tr>'}</tbody></table></div>
      <p class="fraco" style="font-size:12px;margin:10px 0 0">Nos horários: pico na hora · média na hora. As horas são guardadas a partir das coletas.</p>`;
  };

  const desenhar = () => {
    const corpo = $('#met-corpo', el);
    corpo.innerHTML = estMet.aba === 'acomp' ? abaAcomp() : estMet.aba === 'dia' ? abaDia() : abaSemana();
    $('#met-semanas', el).hidden = estMet.aba !== 'semana';
    $('#met-csv', el).hidden = estMet.aba !== 'semana';
    if (estMet.aba === 'semana') {
      $('#met-busca', el).oninput = (e) => { estMet.busca = e.target.value; const p = e.target.selectionStart; desenhar(); const i = $('#met-busca', el); i.focus(); i.setSelectionRange(p, p); };
      $$('#met-segs button', el).forEach((b) => b.onclick = () => { estMet.seg = b.dataset.seg; desenhar(); });
      $$('#met-corpo th[data-ord]', el).forEach((th) => th.onclick = () => {
        const k = th.dataset.ord;
        if (estMet.ordem === k) estMet.dir *= -1; else { estMet.ordem = k; estMet.dir = ['posicao', 'org'].includes(k) ? 1 : -1; }
        desenhar();
      });
    }
    if (estMet.aba === 'acomp') $$('#met-acomp button', el).forEach((b) => b.onclick = () => { estMet.acomp = b.dataset.m; desenhar(); });
    const sel = $('#met-sel-dia', el); if (sel) sel.onchange = (e) => { estMet.dia = e.target.value; desenhar(); };
  };

  el.innerHTML = cab('Relatório semanal · metricas.highrp.net', 'Métricas', `Última leitura: ${lido ? lido.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—'} · semanas de segunda a domingo.`, '<button class="btn sec" id="met-csv">Baixar CSV</button><button class="btn sec" id="met-imprimir">Imprimir</button>') + avisoColetor + `
    <div class="filtros">
      <div class="pilulas" id="met-abas">${[['semana', 'Relatório da semana'], ['acomp', 'Acompanhamento semanal'], ['dia', 'Presença por dia']].map(([v, r]) => `<button data-aba="${v}" class="${estMet.aba === v ? 'ativo' : ''}">${r}</button>`).join('')}</div>
      <div class="pilulas" id="met-semanas">${[...semanas].reverse().map((s) => `<button data-sem="${s.de}" class="${estMet.semana === s.de ? 'ativo' : ''}">${rotuloSemana(s)}${s.parcial ? ' · atual' : s.inicioAcompanhamento ? ' · início' : ''}</button>`).join('')}</div>
    </div>
    <div id="met-corpo"></div>`;
  $$('#met-abas button', el).forEach((b) => b.onclick = () => { estMet.aba = b.dataset.aba; $$('#met-abas button', el).forEach((x) => x.classList.toggle('ativo', x === b)); desenhar(); });
  $$('#met-semanas button', el).forEach((b) => b.onclick = () => { estMet.semana = b.dataset.sem; $$('#met-semanas button', el).forEach((x) => x.classList.toggle('ativo', x === b)); desenhar(); });
  $('#met-imprimir', el).onclick = () => window.print();
  $('#met-csv', el).onclick = () => {
    if (!rel) return;
    const blob = new Blob(['﻿' + csvSemana(rel, nomeFac)], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `metricas-semana-${rel.semana.de}.csv`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  desenhar();
}

/* ================= CONFIGURAÇÕES (admin) ================= */
export async function config({ el }) {
  const [w, usuarios] = await Promise.all([nuvem.lerWebhooks().catch(() => ({})), nuvem.listarUsuarios().catch(() => [])]);
  const papeis = ['ADMIN', 'STAFF', 'CONSULTA'];
  el.innerHTML = cab('Administração', 'Configurações', 'Webhooks do Discord e quem acessa o High OS.') + `
    <div class="grade g-2">
      <section class="painel"><h2>Webhooks dos avisos</h2>
        <p class="muted" style="margin-top:-6px">Os endereços ficam guardados no Firebase, fora do código público. Só a staff logada consegue ler.</p>
        <form id="f-hooks">
          <label class="campo"><span>Webhook de entregas</span><input name="entrega" type="url" value="${esc(w.entrega || '')}" placeholder="https://discord.com/api/webhooks/…"></label>
          <label class="campo"><span>Webhook de recolhimentos</span><input name="recolhimento" type="url" value="${esc(w.recolhimento || '')}" placeholder="https://discord.com/api/webhooks/…"></label>
          <button class="btn" type="submit">Salvar webhooks</button>
        </form>
      </section>
      <section class="painel"><h2>Usuários <button class="btn peq" id="novo-usr">+ Adicionar</button></h2>
        <div class="lista">${usuarios.map((u) => `<div class="item-lista"><span><b>${esc(u.name || u.nome || u.email.split('@')[0])}</b><br><small class="fraco">${esc(u.email)}</small></span>
          <span class="fim selo ${String(u.role).toUpperCase() === 'ADMIN' ? 'acido' : ''}">${esc(String(u.role || 'CONSULTA').toUpperCase())}${u.active === false ? ' · inativo' : ''}</span>
          <button class="btn peq fantasma" data-editar="${esc(u.email)}">Editar</button></div>`).join('') || '<div class="vazio">Sem usuários.</div>'}</div>
      </section>
    </div>`;
  $('#f-hooks', el).onsubmit = async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target).entries());
    for (const k of ['entrega', 'recolhimento']) if (d[k] && !webhookValida(d[k])) return toast(`A webhook de ${k} não parece um endereço de webhook do Discord.`, 'erro');
    try { await nuvem.salvarWebhooks(d); toast('Webhooks salvas.'); } catch (err) { toast('Erro: ' + err.message, 'erro'); }
  };
  const editar = (u) => {
    const m = modal({ titulo: u ? 'Editar usuário' : 'Novo usuário', corpo: `<form id="f-usr">
      <label class="campo"><span>E-mail Google</span><input name="email" type="email" required value="${esc(u?.email || '')}" ${u ? 'readonly' : ''}></label>
      <label class="campo"><span>Nome</span><input name="name" value="${esc(u?.name || u?.nome || '')}"></label>
      <label class="campo"><span>Papel</span><select name="role">${papeis.map((p) => `<option ${String(u?.role || 'STAFF').toUpperCase() === p ? 'selected' : ''}>${p}</option>`).join('')}</select></label>
      <label class="campo"><span>Situação</span><select name="active"><option value="1">Ativo</option><option value="0" ${u?.active === false ? 'selected' : ''}>Inativo</option></select></label></form>`,
      acoes: `${u ? '<button class="btn perigo" data-excluir style="margin-right:auto">Excluir</button>' : ''}<button class="btn fantasma" data-fechar>Cancelar</button><button class="btn" data-salvar>Salvar</button>` });
    m.el.querySelector('[data-salvar]').onclick = async () => {
      const d = Object.fromEntries(new FormData(m.el.querySelector('form')).entries());
      if (!/@/.test(d.email)) return toast('Informe o e-mail.', 'erro');
      try { await nuvem.salvarUsuario(d.email, { name: d.name, role: d.role, active: d.active === '1' }); m.fechar(); toast('Usuário salvo.'); config({ el }); } catch (err) { toast('Erro: ' + err.message, 'erro'); }
    };
    m.el.querySelector('[data-excluir]')?.addEventListener('click', async () => {
      if (!(await confirmar(`Excluir ${u.email} do High OS?`, { ok: 'Excluir', perigo: true }))) return;
      try { await nuvem.excluirUsuario(u.email); m.fechar(); toast('Usuário excluído.'); config({ el }); } catch (err) { toast('Erro: ' + err.message, 'erro'); }
    });
  };
  $('#novo-usr', el).onclick = () => editar(null);
  $$('[data-editar]', el).forEach((bt) => bt.onclick = () => editar(usuarios.find((u) => u.email === bt.dataset.editar)));
}
