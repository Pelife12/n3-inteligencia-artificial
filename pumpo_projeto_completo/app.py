from flask import Flask, render_template, jsonify
from ia import ia_bp

app = Flask(__name__)
app.config['SECRET_KEY'] = 'pumpo_secret'
app.register_blueprint(ia_bp)

@app.route('/')
def index():
    return render_template('view_aluno.html', aluno={"nome": "Aluno Demo", "token_compartilhamento": "demo123"})

@app.route('/api/public/aluno_data/<token>', methods=['GET'])
def mock_aluno_data(token):
    return jsonify({
        "nome": "Aluno Demo",
        "cor_primaria": "#0ea5e9",
        "peso_inicial": 75,
        "dieta": {
            "macros": {"p": 160, "c": 220, "g": 65, "kcal": 2105},
            "refeicoes": [
                {
                    "titulo": "Almoço",
                    "horario": "12:30",
                    "alimentos": [
                        {"nome": "Arroz Branco", "quantidade": 150, "unidade": "g", "proteina": 3, "carboidrato": 42, "gordura": 0, "calorias": 195},
                        {"nome": "Peito de Frango", "quantidade": 150, "unidade": "g", "proteina": 45, "carboidrato": 0, "gordura": 4, "calorias": 240}
                    ]
                }
            ]
        },
        "treino": {
            "ficha": [
                {
                    "titulo": "Treino A",
                    "foco": "Peito e Tríceps",
                    "exercicios": [
                        {"nome": "Supino Reto", "series": "4", "reps": "10", "rest": "60s"}
                    ]
                }
            ]
        },
        "evolucao": [],
        "historico_treinos": []
    })

if __name__ == '__main__':
    app.run(debug=True)
