import { ApiError } from '../utils/ApiError.js';

// A simple in-memory store for our README templates.
const templates = {
  'default': {
    name: 'Default',
    description: 'A standard, all-purpose README template.',
    prompt: `
      Generate a comprehensive and well-structured README.md file for a project with the following file structure.
      
      The README should include the following sections:
      - A compelling project title.
      - A brief, one-sentence description of the project.
      - A "Features" section listing key functionalities.
      - A "Tech Stack" section listing the technologies used (infer from file extensions and names).
      - A "Getting Started" section with basic installation and setup instructions.
      - A "Usage" section explaining how to use the project.
      - A "License" section (default to MIT License).

      Here is the list of file paths in the project:
      {filePaths}

      Please provide only the raw Markdown content for the README.md file.
    `
  },
  'web-app': {
    name: 'Web Application',
    description: 'A template tailored for web applications.',
    prompt: `
      Generate a professional README.md for a web application with the following file structure.
      
      The README must include these specific sections:
      - Project Title
      - Live Demo URL (use a placeholder if not obvious)
      - Screenshots (use placeholders for images)
      - Tech Stack (list frontend and backend technologies)
      - Features
      - Environment Variables (explain how to set up the .env file, list common variables like PORT, DATABASE_URL)
      - Installation and Setup (provide a step-by-step guide)
      - Available Scripts (explain common scripts like 'npm run dev', 'npm start')
      - API Reference (if applicable, briefly describe main endpoints)
      - License

      Here is the list of file paths in the project:
      {filePaths}

      Provide only the raw Markdown content for the README.md file.
    `
  },
  'library': {
    name: 'Library / Package',
    description: 'A template for libraries, packages, or frameworks.',
    prompt: `
      Generate a detailed README.md for a library/package with the following file structure.
      
      The README must include these specific sections:
      - Project Title
      - Badges (include placeholders for version, license, etc.)
      - Overview (a short paragraph explaining what the library does)
      - Installation (show how to install it using common package managers like npm, pip, etc.)
      - Usage (provide clear code examples of how to use the main functions)
      - API Reference (list the main functions/classes and their parameters)
      - Contributing (provide simple guidelines for contributors)
      - License

      Here is the list of file paths in the project:
      {filePaths}

      Provide only the raw Markdown content for the README.md file.
    `
  },
  'classic': {
    name: 'Classic Aesthetic',
    description: 'An elegant, comprehensive template with classic styling and visual appeal.',
    prompt: `
      Generate an elegant and visually appealing README.md file with classic styling for a project with the following file structure.
      
      The README should have a sophisticated, classic design with the following structure:
      
    - **Header Section**:
        - Use the following Markdown and HTML structure *exactly* as provided.
        - Replace only the placeholder text like "Project Title" and "A short tagline." with relevant information inferred from the project files.
        - make the project title big in the center.

        <h1 align="center">Project Title</h1>

        <p align="center">
          <em>A short, impactful tagline about the project.</em>
        </p>

        <p align="center">
          <img src="https://img.shields.io/badge/version-1.0.0-blue.svg" alt="Version">
          <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License">
          <img src="https://img.shields.io/badge/build-passing-brightgreen.svg" alt="Build Status">
        </p>

        ---
            
      - **Table of Contents**: 
        - Well-organized navigation with emoji icons
        - Clickable go to links to major sections
      
      - **Overview Section**:
        - Compelling project description (2-3 paragraphs)
        - Key highlights and value proposition
        - Problem statement and solution approach
      
      - **Visual Showcase**:
        - Screenshots/demo section with placeholder images
        - GIF demonstrations or video links
        - Live demo links with aesthetic buttons
      
      - **Features Section**:
        - Detailed feature list with descriptions
        - Use elegant emoji icons and formatting
        - Group features by category if applicable
        - **Important:** When generating tables, use valid markdown table syntax:
          - Each row must have the same number of columns as the header.
          - The header separator row must use at least three dashes (---) for each column.
          - Each row should start and end with a pipe (|).
          - No extra pipes or missing columns.
          - Example:
            ----------------------------------------------------------------------------  
            | Category           | Feature          | Description                      |
            |--------------------|------------------|----------------------------------|
            | Core Functionality | 🏥 Dashboard     | Consolidates patient records.   |
      
      - **Technology Stack**:
        - Comprehensive tech stack with version info
        - Organized by frontend, backend, database, tools
        - Include brief justification for key technology choices
      
      - **Quick Start Guide**:
        - Prerequisites section
        - Step-by-step installation with code blocks
        - Environment setup instructions
        - First-run verification steps
      
      - **Detailed Usage**:
        - Code examples with syntax highlighting
        - API documentation (if applicable)
        - Configuration options
        - Common use cases and patterns
      
      - **Project Structure**:
        - Visual file tree representation
        - Brief explanation of key directories/files
      
      - **Contributing**:
        - Contributor guidelines
        - Development setup
        - Pull request process
        - Code of conduct reference
      
      - **Roadmap & Changelog**:
        - Future plans and milestones
        - Recent updates and version history
      
      - **Support & Community**:
        - How to get help
        - Community links (Discord, Slack, etc.)
        - FAQ section
      
      - **Credits & Acknowledgments**:
        - Contributors section
        - Inspiration and references
        - Special thanks
      
      - **License & Legal**:
        - License information with badge
        - Copyright notice
      
      **Styling Guidelines**:
      - Use consistent heading hierarchy (# ## ### ####)
      - Include horizontal dividers (---) between major sections
      - Use blockquotes for important notes and warnings
      - Apply consistent emoji usage throughout
      - Use tables for structured data
      - Include code syntax highlighting
      - Add aesthetic spacing and formatting
      - Use centered alignment for headers and badges
      - Include elegant callout boxes for important information
      
      **Tone**: Professional yet approachable, confident, and inspiring. The README should feel like a premium product documentation.

      Here is the list of file paths in the project:
      {filePaths}

      Create a README that feels both timeless and modern, with careful attention to typography, spacing, and visual hierarchy. Provide only the raw Markdown content for the README.md file.
    `
  },
  'aesthetic-pro': {
  name: 'Aesthetic Pro',
  description: 'A template for creating a stunning, visually-rich, and highly accurate README with a professional design.',
  prompt: `
    Generate a stunning, visually-rich, and highly accurate README.md file by performing a deep analysis of the provided project file structure. The final output must be a beautifully formatted, professional document that is as impressive as it is informative.

    **Step 1: Deep Analysis**
    First, thoroughly analyze the file paths to infer the project's type (e.g., Web App, API, Library), primary technologies, core features, and development tools (testing, Docker, etc.). This analysis will inform the content of every section.

    **Step 2: Construct a Visually-Rich Structure**
    Using your analysis, build the README with the following aesthetic structure. You must use Markdown and HTML tags where necessary to achieve the specified visual styling (e.g., for centering).

    ---

    ### **1. Header & Banner**
    - **Logo/Banner:** Start with a centered placeholder for a project logo or a wide hero banner.
      \`<p align="center"><img src="https://placehold.co/800x200/000000/FFFFFF?text=Project+Banner" alt="Project Banner"></p>\`
    - **Project Title:** A large, centered H1 heading for the project name.
      \`<h1 align="center">Project Title</h1>\`
    - **Tagline:** A centered, italicized, and concise tagline that captures the project's essence.
    - **Badges:** A centered collection of stylish badges (e.g., from shields.io). Include placeholders for Version, License, Build Status, and any relevant technologies.

    ---

    ### **2. 📜 Table of Contents**
    - Create a well-organized list with clickable links to all major sections.
    - Use relevant emojis to add visual appeal to each list item.

    ---

    ### **3. 🌟 Overview**
    - Write a compelling 1-2 paragraph description of the project. Explain the problem it solves and its unique value proposition.
    - Use blockquotes to highlight a key feature or a powerful quote about the project's goal.

    ---

    ### **4. 🖼️ Visual Showcase**
    - **If** the project is visual (e.g., a web app), create a section for screenshots or GIFs.
    - Suggest a gallery layout, perhaps using a table to arrange multiple images side-by-side.
    - Include a prominent "Live Demo" button or link if applicable.

    ---

    ### **5. ✨ Core Features**
    - Present the key features in a detailed list.
    - Precede each feature with a descriptive emoji (e.g., 🔐 for Authentication, 💳 for Payments).
    - Group related features under subheadings for clarity.

    ---

    ### **6. 💻 Tech Stack & Tools**
    - Display the technologies used in a visually appealing way, perhaps using a table.
    - Categorize them (e.g., Frontend, Backend, Database, DevOps).
    - Briefly justify the choice of one or two key technologies.

    ---

    ### **7. 🚀 Getting Started**
    - Provide a clear, step-by-step guide for installation and setup.
    - **Prerequisites:** List what users need to have installed beforehand.
    - **Installation:** Use numbered steps and clean, syntax-highlighted code blocks for all commands.
    - **Environment Setup:** If a \`.env\` file is needed, provide a template and explain the key variables.

    ---

    ### **8. 📂 Project Structure**
    - Generate an ASCII file tree to visually represent the project's directory structure.
    - Add brief explanations for the most important files and folders.

    ---

    ### **9. 🤝 Contributing**
    - Provide a welcoming message for potential contributors.
    - Briefly outline the process for submitting pull requests and reporting issues.
    - Link to a \`CONTRIBUTING.md\` file if one exists.

    ---

    ### **10. 📄 License**
    - Clearly state the project's license (default to MIT) and link to the license file.

    ---
    
    **Final Output Instructions:**
    - Use horizontal dividers (\`---\`) to elegantly separate each major section.
    - The tone must be professional, confident, and engaging.
    - Provide only the raw Markdown content for the README.md file.

    Here is the list of file paths in the project:
    {filePaths}
  `
}
};

/**
 * @description Retrieves a list of all available templates.
 * @returns {Array} An array of template objects without the prompt.
 */
const getAvailableTemplates = () => {
    // return an object which matches id like 'default' is an id it will return an object like 
    // { id: 'default', name: 'Default', description: 'A standard, all-purpose README template.' }
  return Object.entries(templates).map(([id, { name, description }]) => ({
    id,
    name,
    description,
  }));
};

/**
 * @description Retrieves a specific template by its ID.
 * @param {string} templateId - The ID of the template (e.g., 'web-app').
 * @returns {object} The full template object, including the prompt.
 */
const getTemplateById = (templateId) => {
    //templateId is expected to be a string like 'default', 'web-app', etc.
  const template = templates[templateId];
  if (!template) {
    throw new ApiError(404, `Template with ID "${templateId}" not found.`);
  }
  return template;
};

export { getAvailableTemplates, getTemplateById };
