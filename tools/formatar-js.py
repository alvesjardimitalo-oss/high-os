"""
Quebra linhas gigantes de JavaScript sem alterar o programa.

A regra e simples e conservadora: insere quebra de linha depois de ';'
que esteja no nivel de instrucao (fora de parenteses, colchetes,
strings, templates, regex e comentarios). Nada mais e tocado.

Depois da transformacao o arquivo e verificado token a token: se a
sequencia de caracteres significativos mudar em um unico byte, a
operacao e abortada.
"""
import sys, io, re

def lex(code):
    """Percorre o codigo marcando a natureza de cada posicao."""
    i, n = 0, len(code)
    estado = []          # pilha de ( [ {
    saida = []           # (indice, tipo) tipo: 'code' | 'str' | 'com'
    prev_sig = ''        # ultimo caractere significativo (para regex vs divisao)
    while i < n:
        c = code[i]
        # comentarios
        if c == '/' and i + 1 < n and code[i+1] == '/':
            j = code.find('\n', i)
            j = n if j < 0 else j
            saida.append((i, j, 'com')); i = j; continue
        if c == '/' and i + 1 < n and code[i+1] == '*':
            j = code.find('*/', i + 2)
            j = n if j < 0 else j + 2
            saida.append((i, j, 'com')); i = j; continue
        # strings
        if c in ('"', "'"):
            j = i + 1
            while j < n:
                if code[j] == '\\': j += 2; continue
                if code[j] == c: j += 1; break
                j += 1
            saida.append((i, j, 'str')); i = j; prev_sig = 'x'; continue
        # template literal (com interpolacao aninhada)
        if c == '`':
            j = i + 1; prof = 0
            while j < n:
                if code[j] == '\\': j += 2; continue
                if code[j] == '$' and j + 1 < n and code[j+1] == '{': prof += 1; j += 2; continue
                if code[j] == '}' and prof: prof -= 1; j += 1; continue
                if code[j] == '`' and not prof: j += 1; break
                j += 1
            saida.append((i, j, 'str')); i = j; prev_sig = 'x'; continue
        # regex literal: so quando o token anterior permite
        # regex tambem e valida depois de palavras-chave (return /.../, typeof, case...)
        pos_palavra = False
        if c == '/':
            k = i - 1
            while k >= 0 and code[k].isspace(): k -= 1
            fim_p = k + 1
            while k >= 0 and (code[k].isalpha() or code[k] == '_'): k -= 1
            palavra = code[k+1:fim_p]
            pos_palavra = palavra in ('return','typeof','case','in','of','new','delete','void','do','else','yield','await','instanceof')
        if c == '/' and (pos_palavra or prev_sig in ('', '(', ',', '=', ':', '[', '!', '&', '|', '?', '{', '}', ';', '+', '-', '*', '%', '<', '>', '~', '^')):
            j = i + 1; dentro_classe = False; ok = False
            while j < n:
                if code[j] == '\\': j += 2; continue
                if code[j] == '[': dentro_classe = True
                elif code[j] == ']': dentro_classe = False
                elif code[j] == '/' and not dentro_classe:
                    j += 1; ok = True; break
                elif code[j] == '\n': break
                j += 1
            if ok:
                while j < n and code[j].isalpha(): j += 1   # flags
                saida.append((i, j, 'str')); i = j; prev_sig = 'x'; continue
        # codigo comum
        if c in '([{': estado.append(c)
        elif c in ')]}':
            if estado: estado.pop()
        saida.append((i, i + 1, 'code', tuple(estado)))
        if not c.isspace(): prev_sig = c
        i += 1
    return saida

def formatar(code):
    partes = []
    for item in lex(code):
        ini, fim, tipo = item[0], item[1], item[2]
        trecho = code[ini:fim]
        if tipo == 'code' and trecho == ';':
            pilha = item[3]
            # so quebra fora de parenteses/colchetes (preserva for(;;) e argumentos)
            if not any(x in ('(', '[') for x in pilha):
                partes.append(';\n')
                continue
        if tipo == 'code' and trecho == ',':
            pilha = item[3]
            # virgula de literal de array/objeto: quebrar e sempre seguro
            if pilha and pilha[-1] in ('[', '{'):
                partes.append(',\n')
                continue
        partes.append(trecho)
    novo = ''.join(partes)
    novo = re.sub(r'\n[ \t]*\n[ \t]*\n+', '\n\n', novo)   # no maximo uma linha em branco
    return novo

def significativo(code):
    """Sequencia de caracteres ignorando espacos fora de strings/comentarios."""
    out = []
    for item in lex(code):
        ini, fim, tipo = item[0], item[1], item[2]
        trecho = code[ini:fim]
        if tipo == 'com':
            continue
        if tipo == 'str':
            out.append(trecho); continue
        if trecho.isspace():
            out.append(' ')     # espacos colapsam, mas nao somem (separam tokens)
            continue
        out.append(trecho)
    txt = re.sub(r'\s+', ' ', ''.join(out))
    # espaco so importa quando separa dois caracteres de identificador;
    # em qualquer outro lugar e irrelevante para o programa
    txt = re.sub(r'(?<![A-Za-z0-9_$]) | (?![A-Za-z0-9_$])', '', txt)
    return txt.strip()

if __name__ == '__main__':
    caminho = sys.argv[1]
    original = io.open(caminho, encoding='utf-8').read()
    novo = formatar(original)

    a, b = significativo(original), significativo(novo)
    if a != b:
        # mostra onde divergiu para facilitar o diagnostico
        for k in range(min(len(a), len(b))):
            if a[k] != b[k]:
                print('DIVERGENCIA na posicao', k)
                print('  antes:', repr(a[max(0,k-60):k+60]))
                print('  agora:', repr(b[max(0,k-60):k+60]))
                break
        print('ABORTADO — o codigo mudou. Nada foi gravado.')
        sys.exit(1)

    antes_max = max(len(l) for l in original.split('\n'))
    depois_max = max(len(l) for l in novo.split('\n'))
    io.open(caminho, 'w', encoding='utf-8').write(novo)
    print(f'{caminho}: {len(original.split(chr(10)))} -> {len(novo.split(chr(10)))} linhas | '
          f'maior linha {antes_max} -> {depois_max} caracteres')
