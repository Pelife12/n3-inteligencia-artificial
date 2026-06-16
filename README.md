# Pumpo

https://www.pumpo.com.br/

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

# Release Notes — Pumpo
 
## Versão 1.0 (MVP — Foco Exclusivo na Visão do Aluno)
 
### Resumo Executivo
Esta versão estabelece o MVP (Minimum Viable Product) do **Pumpo**, com foco 100% na experiência do aluno (Frontend). O sistema foi simplificado para atuar como uma aplicação cliente leve conectada a um backend (API Gateway) em Flask, demonstrando as integrações de Inteligência Artificial para facilitar o registro de treinos e dieta, eliminando o atrito do preenchimento manual.
 
### Principais Funcionalidades Implementadas
* **Leitura de Pratos por Imagem:** O aluno tira a foto da refeição e a IA processa e devolve calorias e macronutrientes extraídos automaticamente.
* **Assistente Nutri/Personal Virtual:** Um chat integrado que responde a dúvidas do universo fitness (treinos, dieta, execução) com restrições de segurança.
* **Substituição Inteligente:** O aluno seleciona um alimento da dieta e a IA sugere 3 trocas equivalentes baseadas nos macros.
* **Histórico e Execução de Treinos:** Interface para visualização da ficha de treino, busca dinâmica de GIFs de execução e conclusão rápida de sessões.
 
### Arquitetura e Engenharia Aplicada
* **Otimização de Câmera e Memória (Frontend):** Implementação de compressão via `HTML5 Canvas`. As fotos tiradas pelo celular são redimensionadas e convertidas em Base64 diretamente no navegador do usuário antes do envio. Isso previne o travamento (crash) por falta de memória (RAM) em dispositivos móveis.
* **Backend Minimalista:** O Flask atua apenas como orquestrador, mockando os dados de entrada do aluno e gerenciando as chamadas seguras para a API do Google Gemini, ocultando as chaves de segurança.
 
### Tecnologias de Inteligência Artificial
* **Agente Reativo (Visão Computacional):** Analisa o estado atual (foto em Base64) e reage devolvendo a contagem estruturada de macronutrientes.
* **Agente Conversacional (Processamento de Linguagem Natural - NLP):** Interage via chat. Utiliza *System Prompts* estritos para restringir as respostas ao domínio fitness, bloqueando a emissão de diagnósticos médicos.
* **Heurística de Equivalência Nutricional:** A lógica matemática que a IA utiliza para sugerir a substituição de alimentos buscando a menor diferença entre Proteínas, Carboidratos e Gorduras.
* **Heurística de Tonelagem:** Abordagem adotada para o registro de treinos, baseada na fórmula Volume = Carga x Repetições x Séries.
 
### Limitações Conhecidas e Fora de Escopo (Nesta Versão)
* O painel administrativo do Personal Trainer e o banco de dados relacional complexo foram removidos do escopo deste MVP para focar na entrega da interação IA-Aluno.
* O algoritmo classificador probabilístico (*Naive Bayes*) para predição de evasão (Churn) de alunos foi movido para o roadmap da Versão 2.0.
 
---
 
## FAQ — Perguntas Frequentes
 
### 1. Por que o sistema foi reduzido apenas à visão do aluno?
Para garantir a estabilidade da demonstração ao vivo e focar no núcleo da inovação do projeto: a redução de atrito no preenchimento de dados usando Agentes Inteligentes. O gerenciamento de usuários foi mockado no backend para agilizar a validação desta hipótese.
 
### 2. Como o Agente Conversacional garante a segurança do usuário?
Através de engenharia de prompt (System Prompts). O modelo de linguagem (LLM) está instruído a atuar unicamente como educador físico e nutricionista assistente. Qualquer solicitação de diagnóstico clínico, receita de remédios ou tratamento de lesões graves aciona um bloqueio de segurança que instrui o aluno a procurar um médico humano.
 
### 3. Como o sistema evita que a câmera trave celulares mais antigos?
Celulares modernos tiram fotos de até 48MP, o que excede o limite de memória dos navegadores mobile em aplicações web. Resolvemos isso aplicando o desenho e compressão da imagem via elemento `<canvas>` no Javascript antes de realizar a requisição HTTP.
 
### 4. O que aconteceu com o Classificador Naive Bayes?
O Naive Bayes é focado na retenção e análise de evasão por parte do personal trainer. Como esta versão foca 100% na interface e usabilidade do *aluno*, o classificador preditivo foi isolado do escopo de entrega atual e documentado como evolução técnica para a plataforma de gestão (Visão Personal).
