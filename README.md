# LaTeX Resume ATS Optimizer 🚀

[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![Flask](https://img.shields.io/badge/flask-3.0+-green.svg)](https://flask.palletsprojects.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A powerful Flask-based ATS resume optimizer that intelligently tailors your LaTeX resume to job descriptions. Choose between **AI-powered bullet rewriting** (PRO Mode with Groq LLM) or **fast rule-based keyword injection** (SMART Mode).

---

## ✨ Features

### 🤖 PRO Mode (Groq LLM)
- **AI-Powered Rewriting**: Uses Groq's `llama-3.3-70b-versatile` model to intelligently rewrite bullets
- **Smart Keyword Integration**: Naturally weaves job keywords into your experience
- **Role Detection**: Automatically detects target role (Technical, Analytical, PM, DevOps, etc.)
- **PM Terminology Enrichment**: Automatically injects PM buzzwords (roadmapping, stakeholder management, SDLC, OKRs/KPIs)
- **Validation**: Ensures 20-25% word growth, prevents bloat and hallucinations
- **API Key Rotation**: Supports multiple Groq accounts to handle rate limits

### ⚡ SMART Mode (Rule-Based)
- **Pattern-Based Injection**: Fast keyword insertion using proven patterns
- **Categorized Skills**: Intelligently enhances 4-category skills format
- **No API Required**: Works offline, no API keys needed
- **Reliable Fallback**: Always available when PRO mode unavailable

### 📄 Resume Features
- **4-Category Skills Format**: PM & Agile / Data & Cloud / BI & Analytics / SAP & Tech
- **LaTeX Template**: Professional single-page resume using `cop.tex`
- **Percentage Handling**: Automatic LaTeX escaping for metrics (15% → 15\\%)
- **Web Interface**: Clean Flask UI for easy job description input

---

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/Rikinshah787/LaTeX-Resume-ATS-Optimizer.git
cd LaTeX-Resume-ATS-Optimizer
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Environment (For PRO Mode)
```bash
# Copy the example environment file
copy .env.example .env

# Edit .env and add your Groq API keys
# Get keys from: https://console.groq.com/keys
GROQ_API_KEY=gsk_YOUR_PRIMARY_KEY_HERE
GROQ_API_KEY_2=gsk_YOUR_SECOND_KEY_HERE  # Optional for rotation
GROQ_API_KEY_3=gsk_YOUR_THIRD_KEY_HERE   # Optional for rotation
```

### 4. Run the Application
```bash
# Using Python
python app.py

# Or using PowerShell script
.\scripts\start.ps1
```

### 5. Open in Browser
Navigate to: **http://localhost:5001**

---

## 📖 Usage

### Step 1: Choose Mode
- **PRO Mode**: AI-powered rewriting (requires Groq API key)
- **SMART Mode**: Rule-based keyword injection (no API key required)

### Step 2: Paste Job Description
Copy the full job description from the posting and paste it into the text area.

### Step 3: Generate Resume
Click "Generate Resume" and wait for:
- ✅ Keyword extraction
- ✅ Bullet rewriting/enhancement
- ✅ Skills optimization
- ✅ LaTeX compilation
- ✅ PDF generation

### Step 4: Download
Your tailored resume will be generated in the `generated/` directory.

---

## 📁 Project Structure

```
LaTex_Resume/
├── app.py                          # Main Flask application (PRO Mode)
├── ats_optimizer_v4_smart.py       # SMART mode optimizer
├── cop.tex                         # Master LaTeX resume template
├── requirements.txt                # Python dependencies
├── .env.example                    # Environment variables template
│
├── utils/                          # Utility scripts
├── templates/                      # HTML templates (Flask UI)
├── templates_latex/                # LaTeX templates and backups
├── generated/                      # Generated resume files
├── output/                         # Final PDFs and Word docs
├── tests/                          # All test files
├── scripts/                        # Build and utility scripts
├── docs/                           # Documentation
└── archive/                        # Old versions
```

See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for detailed directory layout.

---

## 🔧 Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GROQ_API_KEY` | For PRO mode | None | Primary Groq API key |
| `GROQ_API_KEY_2` | Optional | None | Secondary key (rotation) |
| `GROQ_API_KEY_3` | Optional | None | Tertiary key (rotation) |
| `USE_GROQ` | Optional | `false` | Enable PRO mode |
| `LOG_REQUESTS` | Optional | `false` | Enable request logging |
| `GROQ_MAX_BULLET_GROWTH` | Optional | `10` | Max words added per bullet |

### Validation Settings

PRO Mode enforces these constraints:
- **Total Growth**: 20-25% word count increase
- **Per-Bullet Growth**: Max 10 words or 25% per bullet
- **Minimum Word Count**: 12 words per bullet
- **Action Verbs**: Must start with strong action verb
- **No Markdown**: Plain text only (LaTeX allowed)
- **Proper Endings**: Must end with punctuation (. ! ? % \\%)

---

## 📚 Documentation

- [Quick Start Guide](docs/QUICK_START.md) - Get up and running fast
- [Groq Setup Guide](docs/GROQ_SETUP.md) - Configure PRO mode
- [Groq Ready Checklist](docs/GROQ_READY.md) - Verify your setup
- [ATS README](docs/ATS_README.md) - ATS optimization tips
- [Changelog v4](docs/CHANGELOG_v4.md) - Version 4 changes

---

## 🧪 Testing

Run tests to verify everything works:

```bash
# Run all tests
python -m pytest tests/

# Run specific test
python tests/test_groq_mode.py

# Run validation tests
python tests/test_validation.py
```

---

## 🛠️ Troubleshooting

### PRO Mode Not Working?
1. **Check API Key**: Verify `GROQ_API_KEY` is set in `.env`
2. **Check Rate Limits**: Add more API keys for rotation
3. **Check Logs**: Look in `logs/requests.log` for errors
4. **Try SMART Mode**: Always available as fallback

### Validation Failures?
- **Too Much Growth**: Groq rewrites too verbose (adjust prompts)
- **Too Little Growth**: Need more keyword injection
- **Use Conservative Mode**: Automatically tries after first failure

### LaTeX Compilation Errors?
- **Check Template**: Ensure `cop.tex` exists in root
- **Check Syntax**: Look for unescaped % signs
- **Check Logs**: LaTeX errors in generated `.log` files

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Groq**: For the amazing LLaMA 3.3 70B API
- **Flask**: Web framework
- **LaTeX**: Resume templating
- **autoCV**: Original resume template inspiration

---

## 📧 Contact

**Rikin Shah**
- GitHub: [@Rikinshah787](https://github.com/Rikinshah787)
- Repository: [LaTeX-Resume-ATS-Optimizer](https://github.com/Rikinshah787/LaTeX-Resume-ATS-Optimizer)

---

## ⭐ Star History

If you find this project helpful, please consider giving it a star! ⭐
