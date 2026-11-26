// HIGH OS — telas. Tudo o que vem das planilhas é só leitura.
import { esc, $, $$, moeda, pct, classeSeg, norm, toast, modal, confirmar, copiar } from './ui.js';
import { SEGMENTOS, IMAGENS_MN } from './dados.js';
import * as nuvem from './nuvem.js';
import { avisoEntrega, avisoRecolhimento, corpoWebhook, webhookValida, beneficiosDaFaccao } from './avisos.js';
import { avisoPlanilha } from './app.js';

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
    if (!(await confirmar(`Publicar o aviso de ${tipo} do ${d.group}${d.faccao ? ' (' + d.faccao + ')' : ''} no Discord?`, { ok: 'Publicar' }))) return;
    const bt = form.querySelector('[type=submit]'); bt.disabled = true;
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpoWebhook(aviso())) });
      if (!r.ok) throw new Error('O Discord recusou (HTTP ' + r.status + ').');
      await nuvem.registrarAviso({ tipo, group: d.group, faccao: d.faccao || '', segmento: d.segmento, dados: d }).catch(() => {});
      toast('Aviso publicado no Discord.');
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
export function metricas({ el }) {
  el.innerHTML = cab('metricas.highrp.net', 'Métricas', 'Métricas das facções vindas do site de métricas do High, com a sessão do Discord do administrador.') + `
    <div class="painel vazio"><h2 style="margin-bottom:8px">Em integração</h2>As métricas entram assim que o computador do administrador for conectado para a leitura do site com a sessão do Discord.</div>`;
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
