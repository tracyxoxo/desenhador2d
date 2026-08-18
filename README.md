# Desenhador2D

Projeto mínimo de um desenhador 2D com pilha Python + FastAPI + HTML/CSS.

Funcionalidades:
- Controle de pixels (acender/apagar)
- Primitivos: Ponto, Reta, Círculo, Retângulo, Triângulo
- Estrutura de dados (ED) para armazenar primitivos
- Redesenhar por tipo ou todos; limpar somente a tela

Como executar:

1. Criar e ativar um ambiente virtual Python
2. Instalar dependências:

```bash
pip install -r requirements.txt
```

3. Rodar o servidor:

```bash
uvicorn main:app --reload
```

4. Abrir `http://127.0.0.1:8000/` no navegador.

Observações de avaliação: organizar código, documentação e ED implementada.
