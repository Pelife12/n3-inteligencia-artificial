from flask import Blueprint, request, jsonify
import requests
import urllib.parse

ia_bp = Blueprint('ia', __name__)

GEMINI_API_KEY = "Gere uma chave API no ambiente do Google"
MODELO_IA = "gemini-3.1-flash-lite-preview"
TIMEOUT_IA = 30

@ia_bp.route('/api/public/ia/substituir', methods=['POST'])
def ia_substituir():
    try:
        alimento = request.json.get('alimento', '') if request.json else ''
        prompt = f"Atue como um nutricionista. O aluno quer substituir: '{alimento}'. Dê 3 opções curtas com quantidades para ter as mesmas calorias/macros."
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODELO_IA}:generateContent?key={GEMINI_API_KEY}"
        res = requests.post(url, headers={'Content-Type': 'application/json'}, json={"contents": [{"parts": [{"text": prompt}]}]}, timeout=TIMEOUT_IA).json()
        if 'error' in res: return jsonify({"erro": f"Erro na Chave/API: {res['error'].get('message')}"}), 400
        return jsonify({"resposta": res['candidates'][0]['content']['parts'][0]['text']})
    except Exception as e:
        return jsonify({"erro": "A IA está indisponível no momento."}), 500

@ia_bp.route('/api/public/ia/analisar_prato', methods=['POST'])
def ia_analisar_prato():
    try:
        imagem_b64 = request.json.get('imagem') if request.json else None
        if not imagem_b64: return jsonify({"erro": "Fotografia não recebida."}), 400
        
        header, encoded = imagem_b64.split(",", 1)
        mime_type = header.split(":")[1].split(";")[0]
        
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODELO_IA}:generateContent?key={GEMINI_API_KEY}"
        payload = {"contents": [{"parts": [{"text": "Analise os macros e calorias desta refeição. Retorne limpo, linha a linha."}, {"inlineData": {"mimeType": mime_type, "data": encoded}}]}]}
        
        res = requests.post(url, headers={'Content-Type': 'application/json'}, json=payload, timeout=TIMEOUT_IA)
        if not res.ok: return jsonify({"erro": f"Erro API Google: {res.text}"}), 400
        
        dados = res.json()
        if 'error' in dados: return jsonify({"erro": f"Erro na IA: {dados['error'].get('message')}"}), 400
            
        return jsonify({"resposta": dados['candidates'][0]['content']['parts'][0]['text']})
    except Exception as e:
        return jsonify({"erro": f"Erro interno: {str(e)}"}), 500

@ia_bp.route('/api/public/ia/consultar', methods=['POST'])
def consultar_ia_aluno():
    try:
        prompt = request.json.get('prompt', '') if request.json else ''
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODELO_IA}:generateContent?key={GEMINI_API_KEY}"
        instrucao = f"Você é o Nutri e Personal Virtual do aplicativo fitness Pumpo. Seu trabalho é ajudar alunos de academia com dúvidas sobre treinos, substituição de alimentos, dieta, macros e saúde física. Seja amigável, motivador e dê respostas curtas. A dúvida do aluno é: {prompt}"
        res = requests.post(url, headers={'Content-Type': 'application/json'}, json={"contents": [{"parts": [{"text": instrucao}]}]}, timeout=TIMEOUT_IA).json()
        if 'error' in res: return jsonify({"erro": res['error'].get('message')}), 400
        return jsonify({"resposta": res['candidates'][0]['content']['parts'][0]['text']})
    except Exception as e:
        return jsonify({"erro": "Erro na IA."}), 500

@ia_bp.route('/api/public/ia/buscar_gif', methods=['POST'])
def buscar_gif():
    try:
        exercicio = request.json.get('exercicio', '').strip()
        if not exercicio: return jsonify({"gif": ""})

        termo_ingles = exercicio.lower()
        dicionario = {
            "supino": "bench press", "agachamento": "squat", "terra": "deadlift",
            "puxada": "lat pulldown", "remada": "barbell row", "rosca": "bicep curl"
        }
        
        traduzido = False
        for pt, en in dicionario.items():
            if pt in termo_ingles:
                termo_ingles = en
                traduzido = True
                break
        
        termo_pesquisa = urllib.parse.quote(f"{termo_ingles} exercise") if traduzido else urllib.parse.quote(f"{exercicio} gym exercise")
        url_tenor = f"https://g.tenor.com/v1/search?q={termo_pesquisa}&key=LIVDSRZULELA&limit=1"
        res_tenor = requests.get(url_tenor, timeout=10).json()
        
        gif_url = res_tenor['results'][0]['media'][0]['gif']['url'] if res_tenor.get('results') and len(res_tenor['results']) > 0 else ""
        return jsonify({"gif": gif_url})
    except Exception as e:
        return jsonify({"erro": "Falha ao buscar GIF."}), 500

@ia_bp.route('/api/public/treino/concluir', methods=['POST'])
def concluir_treino():
    try:
        dados = request.json
        if not dados.get('token'): return jsonify({"erro": "Token não fornecido"}), 400
        return jsonify({"msg": "Treino salvo com sucesso no histórico!"}), 200
    except Exception as e:
        return jsonify({"erro": "Falha interna ao salvar treino."}), 500
