# Desenhador2D

Aplicação web para desenho de primitivos gráficos 2D com manipulação direta de pixels. Os algoritmos de rasterização (Bresenham, Midpoint) são implementados manualmente, sem uso de bibliotecas gráficas prontas.

---

## Arquitetura

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (HTML/JS/CSS)             │
│                                                     │
│  ┌─────────┐  ┌──────────┐  ┌────────────────────┐  │
│  │ Toolbar │  │  Grid    │  │  Logs / ED Viewer  │  │
│  │ (tools) │  │ (64×48)  │  │                    │  │
│  └────┬────┘  └────┬─────┘  └────────────────────┘  │
│       │            │                                 │
│       └────────────┼── fetch() ──────────────────┐   │
└────────────────────┼─────────────────────────────┼───┘
                     │         HTTP/JSON            │
┌────────────────────┼─────────────────────────────┼───┐
│                    ▼      Backend (FastAPI)       ▼   │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │              Rotas (main.py)                  │    │
│  │  POST /pixel     → liga/desliga 1 pixel       │    │
│  │  POST /primitive → cria primitivo na ED       │    │
│  │  POST /redraw    → limpa + redesenha da ED    │    │
│  │  POST /clear     → limpa tela (preserva ED)   │    │
│  │  GET  /state     → retorna pixels + ED        │    │
│  │  GET  /ed        → retorna conteúdo da ED     │    │
│  └──────────┬───────────────────────┬────────────┘    │
│             │                       │                 │
│  ┌──────────▼──────────┐  ┌────────▼─────────────┐   │
│  │   Canvas (models.py) │  │    ED (models.py)     │   │
│  │                      │  │                       │   │
│  │  pixels[48][64]      │  │  items = [Primitive]  │   │
│  │  (matriz booleana)   │  │  (lista em memória)   │   │
│  │                      │  │                       │   │
│  │  set_pixel(x,y,on)  │  │  add(prim)            │   │
│  │  get_pixel(x,y)     │  │  create_from_payload() │   │
│  │  clear()            │  │  redraw(canvas, kind)  │   │
│  └──────────────────────┘  └───────────────────────┘   │
│                                                       │
│  ┌────────────────────────────────────────────────┐   │
│  │            Primitivos (models.py)               │   │
│  │                                                 │   │
│  │  Point ─── set_pixel direto                     │   │
│  │  Line  ─── Algoritmo de Bresenham               │   │
│  │  Circle ── Algoritmo Midpoint Circle            │   │
│  │  Rect  ─── 4 retas (Bresenham)                  │   │
│  │  Triangle─ 3 retas (Bresenham)                  │   │
│  └────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────┘
```

### Componentes

| Arquivo | Responsabilidade |
|---|---|
| `main.py` | Servidor FastAPI — define as rotas HTTP e instancia o Canvas e a ED |
| `models.py` | Classes de domínio: `Canvas`, `ED`, e os primitivos (`Point`, `Line`, `Circle`, `Rect`, `Triangle`) |
| `static/index.html` | Interface do usuário — toolbar, grade de pixels, editor JSON, logs |
| `static/app.js` | Lógica do frontend — ferramentas interativas, comunicação com o backend |
| `static/styles.css` | Estilos visuais da interface |
| `iniciar.bat` | Script para iniciar o projeto com um duplo clique |

### Algoritmos implementados

- **Ponto**: ativa diretamente um pixel na matriz booleana.
- **Reta**: [Algoritmo de Bresenham](https://en.wikipedia.org/wiki/Bresenham%27s_line_algorithm) — calcula pixel a pixel quais posições ligar para formar a reta, sem usar aritmética de ponto flutuante.
- **Círculo**: [Midpoint Circle Algorithm](https://en.wikipedia.org/wiki/Midpoint_circle_algorithm) — utiliza a simetria de 8 pontos para calcular os pixels da circunferência.
- **Retângulo**: composto por 4 retas (Bresenham).
- **Triângulo**: composto por 3 retas (Bresenham).

### ED (Estrutura de Dados)

A ED é uma lista simples em memória (`list` do Python) que armazena todos os primitivos criados. Ela permite:

- **Adicionar** primitivos
- **Redesenhar** todos ou filtrados por tipo (ex.: somente retas, somente círculos)
- **Persistência na limpeza**: o botão "Limpar Tela" zera apenas a matriz de pixels, sem remover os primitivos da ED

---

## Pré-requisitos

- **Python 3.8+** instalado e acessível no PATH
- **pip** (gerenciador de pacotes do Python)

---

## Como inicializar

### Opção 1 — Script automático (Windows)

Dê duplo clique no arquivo `iniciar.bat`. Ele instala as dependências, inicia o servidor e abre o navegador automaticamente.

### Opção 2 — Manual (qualquer SO)

```bash
# 1. Instalar dependências
pip install -r requirements.txt

# 2. Iniciar o servidor
python -m uvicorn main:app --host 127.0.0.1 --port 8000

# 3. Abrir no navegador
# Acesse: http://127.0.0.1:8000
```

---

## Como usar

1. **Selecione a ferramenta** no dropdown:
   - **Ponto** — 1 clique na grade
   - **Reta** — 2 cliques (ponto A → ponto B)
   - **Círculo** — 2 cliques (centro → borda, o raio é calculado pela distância)
   - **Retângulo** — 2 cliques (canto superior-esquerdo → canto inferior-direito)
   - **Triângulo** — 3 cliques (vértice A → B → C)

2. **Clique na grade** para desenhar.

3. **Limpar Tela** — apaga os pixels da tela, mas mantém os primitivos na ED.

4. **Redesenhar** — redesenha os primitivos da ED na tela, com filtro por tipo.

5. **Listar ED** — mostra todos os primitivos armazenados.

6. **Adicionar via JSON** — insira um JSON manualmente no editor, ex.:
   ```json
   {"type": "circle", "xc": 30, "yc": 24, "r": 10}
   ```

---

## Estrutura de diretórios

```
desenhador2d/
├── main.py              # Servidor FastAPI (rotas)
├── models.py            # Canvas, ED e Primitivos
├── requirements.txt     # Dependências (fastapi, uvicorn)
├── iniciar.bat          # Script de inicialização (Windows)
├── test_draw.py         # Teste de desenho via API
├── test_primitives.py   # Teste de todos os primitivos
└── static/
    ├── index.html       # Página principal
    ├── app.js           # Lógica do frontend
    └── styles.css       # Estilos
```
