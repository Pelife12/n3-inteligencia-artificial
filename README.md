# Pumpo

## Release Notes (Versão 0.1 — Conceitual)

### Nome e versão do sistema
Pumpo - Versão 0.1

### Resumo Executivo
Um assistente inteligente que automatiza o acompanhamento fitness. O sistema utiliza IA para ler fotos de refeições e um chat virtual para tirar dúvidas, ajudando o personal trainer a poupar tempo e evitando que os alunos abandonem a consultoria.

### Principais Funcionalidades Previstas
* **Diário por Foto:** O aluno tira uma foto do prato e a IA extrai calorias e macronutrientes.
* **Assistente Virtual:** Agente conversacional que responde a dúvidas sobre treinos e saúde.
* **Trocas Inteligentes:** Mecanismo que sugere substituições de alimentos com base na equivalência calórica.
* **Radar de Risco:** Painel preditivo que alerta o personal caso um aluno corra risco de desistir.

### Tecnologias e Técnicas de IA Utilizadas
* **Tipos de Agentes:**
  * *Agente Reativo:* Analisa a foto do prato e extrai os dados via Visão Computacional.
  * *Agente Conversacional:* Processamento de Linguagem Natural via LLM para o chat.
* **Heurísticas:** *Heurística de Equivalência Nutricional* (busca matemática que calcula e minimiza a diferença de calorias e macros para sugerir a troca de um alimento).
* **Classificador Probabilístico (Naive Bayes):** Algoritmo que cruza atributos do aluno (qualidade do sono, nível de stresse e frequência nos treinos) para calcular a probabilidade de ele desistir do plano.

### Limitações Conhecidas e Itens Fora do Escopo
* Fotos muito escuras ou alimentos muito misturados (como sopas) reduzem a precisão da leitura.
* O sistema não realiza nenhum tipo de diagnóstico médico ou prescrição clínica.
* A geração de treinos complexos do zero sem supervisão humana está fora do escopo desta versão.

### Possíveis Evoluções para Versões Futuras (Versão 0.2)
* Desenvolvimento de um agente de aprendizagem automática (*Machine Learning*) ligado à base de dados, capaz de sugerir o aumento automático das cargas (kg) dos exercícios com base na progressão de força semanal do aluno.

---

## FAQ — Perguntas Frequentes

### 1. Como funciona o processo de tomada de decisão do agente no sistema de substituição alimentar?
A decisão baseia-se numa heurística de busca que prioriza alimentos da mesma categoria e seleciona as três opções com valores nutricionais (calorias, hidratos de carbono, proteínas e gorduras) mais próximos do alimento original.

### 2. O sistema utiliza aprendizagem ao longo do tempo?
Nesta versão 0.1, o sistema é reativo e responde a estímulos isolados (fotos e prompts). A aprendizagem contínua, focada em compreender a evolução de força do aluno para ajustar treinos, será implementada na versão 0.2.

### 3. Qual foi a escolha e justificativa da heurística adotada para treinos?
Adotámos a Heurística de Tonelagem (Carga x Repetições x Séries). A justificativa é que esta fórmula matemática simplifica a medição da sobrecarga progressiva, permitindo ao algoritmo avaliar rapidamente se o aluno está a evoluir ou se está estagnado.

### 4. Em quais situações o classificador probabilístico (Naive Bayes) é utilizado?
É utilizado no módulo de retenção. O classificador cruza variáveis independentes recolhidas nos check-ins semanais (stresse, sono, dores) para calcular a probabilidade de um aluno abandonar a consultoria no mês seguinte.

### 5. Quais são as entradas e saídas do sistema de análise de fotos?
A entrada é uma imagem tirada pelo telemóvel do utilizador e enviada em formato Base64. A saída é um ficheiro de texto estruturado listando os alimentos identificados e a contagem total de macronutrientes.

### 6. Como o agente lida com dúvidas fora do escopo fitness?
O agente possui instruções restritivas de sistema (*system prompts*). Se o utilizador solicitar diagnósticos médicos ou conselhos sobre lesões, o agente encerra a análise e orienta a busca por um médico ou pelo personal trainer responsável.
