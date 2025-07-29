# Aplicação de Avaliação de Escolas

Esta aplicação web permite registrar notas e fotos de visitas a escolas e visualizar resultados agregados. Foi desenvolvida para funcionar com Firebase Firestore e Storage.

## Pré‑requisitos

1. **Conta no Firebase** com um projeto configurado.
2. **Firestore habilitado** para armazenar as avaliações.
3. **Cloud Storage habilitado** no projeto (requer o plano Blaze; há cota gratuita).
4. **Configuração do aplicativo Web** (os valores `apiKey`, `authDomain`, etc.).

## Como configurar

1. Copie o diretório `school_eval_app` para o ambiente onde deseja hospedar a aplicação (por exemplo, Firebase Hosting, Vercel, Netlify ou um servidor estático).
2. Abra o arquivo `firebaseConfig.js` e substitua os valores de `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId` e `appId` pelos fornecidos no console do Firebase ao registrar um app Web.
3. Ajuste as regras do Firestore e do Storage conforme necessário. Para testes rápidos, regras públicas podem ser usadas, mas para produção recomenda‑se restringir gravações e leituras apenas a usuários autenticados.

## Estrutura dos arquivos

- `index.html` – página principal que lista as médias das pontuações por escola.
- `evaluate.html` – página para inserir uma nova avaliação, com notas de 1 a 10 para cada critério e upload de até 3 fotos por critério.
- `styles.css` – estilos básicos para a aplicação.
- `firebaseConfig.js` – script onde você insere as credenciais do Firebase.
- `index.js` – carrega e exibe resultados agregados a partir do Firestore e gera relatórios PDF (com fotos) e Excel (somente notas).
- `evaluate.js` – gerencia o envio de avaliações, incluindo upload de imagens para o Storage e registro no Firestore.
- `README.md` – este documento com instruções.

## Hospedagem

A aplicação é composta apenas de arquivos estáticos (HTML, CSS e JS) e pode ser hospedada em qualquer serviço de hospedagem estática. Para usar o **Firebase Hosting**:

1. Instale a CLI do Firebase (`npm install -g firebase-tools`).
2. Faça login (`firebase login`).
3. No diretório `school_eval_app`, execute `firebase init hosting` e siga as instruções, apontando a pasta pública para `.` (ponto) ou para `dist` conforme preferir.
4. Execute `firebase deploy` para enviar a aplicação. Certifique‑se de que o app Web foi adicionado ao projeto e que `firebaseConfig.js` contém as credenciais corretas.

Alternativamente, você pode publicar os arquivos em plataformas como Netlify ou Vercel arrastando e soltando a pasta.

## Uso

1. Acesse `evaluate.html` para registrar uma nova avaliação. Preencha seu nome, e‑mail e o nome da escola. Para cada critério, atribua uma nota de 1 a 10 e (opcionalmente) envie até 3 fotos. Após o envio, uma mensagem de sucesso será exibida.
2. Acesse `index.html` para visualizar as médias por escola. A lista se atualiza a cada carregamento.

## Geração de relatórios

Na página de resultados (`index.html`) há dois botões opcionais para exportar dados:

- **Relatório PDF** – gera um arquivo PDF chamado `relatorio_avaliacoes.pdf` contendo os detalhes de cada avaliação individual, incluindo as fotos enviadas para cada critério. A geração pode demorar alguns segundos dependendo da quantidade de imagens e da velocidade da rede. A biblioteca jsPDF é carregada via CDN para criar o documento.

- **Relatório Excel** – gera um arquivo `avaliacoes.xlsx` contendo todas as avaliações em formato tabular. Cada linha representa uma avaliação (escola, avaliador, e‑mail, data e notas de cada critério). As fotos não são incluídas. A biblioteca SheetJS (XLSX) é utilizada para criar a planilha.

Os arquivos são baixados automaticamente pelo navegador quando você clica no respectivo botão. Essa funcionalidade está disponível apenas na página de resultados; é necessário haver avaliações para que os botões fiquem habilitados.

## Considerações

- Fotos enviadas são armazenadas no Cloud Storage sob o diretório `evaluations/<ID da avaliação>/<critério>/`.
- O Firestore armazena cada avaliação com campos: nome da escola, nome do avaliador, e‑mail, timestamp, notas e URLs das fotos. Essa estrutura permite ampliar o número de escolas ou critérios no futuro.
- Para coletar informações de várias pessoas, basta distribuir o link para `evaluate.html` após hospedar a aplicação; cada avaliador insere seu nome e e‑mail manualmente.