# Contributing to French Phrase Tetris

Thank you for your interest in contributing to French Phrase Tetris! This document provides guidelines and instructions for contributing.

## How to Contribute

1. **Fork the Repository**
   - Fork the repository to your GitHub account
   - Clone your fork locally

2. **Set Up Development Environment**
   ```bash
   # Clone your fork
   git clone https://github.com/YOUR-USERNAME/french-phrase-tetris
   cd french-phrase-tetris

   # Create virtual environment
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate

   # Install dependencies
   pip install -r requirements.txt
   ```

3. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Development Guidelines**
   - Follow the existing code style
   - Write clear, commented code
   - Test your changes thoroughly
   - Keep commits focused and atomic
   - Use meaningful commit messages

5. **Testing**
   - Run existing tests: `pytest`
   - Add tests for new features
   - Ensure all tests pass before submitting

6. **Submit a Pull Request**
   - Push changes to your fork
   - Create a Pull Request from your branch
   - Describe your changes in detail
   - Reference any related issues

## Project Structure
```
french-phrase-tetris/
├── frontend/           # Frontend game files
│   ├── assets/        # Game assets (images, audio)
│   ├── js/           # JavaScript game logic
│   └── index.html    # Main game page
├── backend/           # Python backend
│   ├── api/          # API endpoints
│   └── services/     # Game services
└── tests/            # Test files
```

## Style Guidelines

- Use ES6+ features for JavaScript
- Follow PEP 8 for Python code
- Use meaningful variable and function names
- Comment complex logic
- Keep functions focused and small

## Feature Requests and Bug Reports

- Use GitHub Issues for bug reports and feature requests
- Check existing issues before creating new ones
- Provide detailed descriptions and steps to reproduce

## Questions?

Feel free to open an issue for any questions about contributing.

Thank you for helping improve French Phrase Tetris!