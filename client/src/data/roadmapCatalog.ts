export type RoadmapCategory = "role" | "skill";

export type RoadmapTopic = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  sourcePath: string;
};

export type Roadmap = {
  slug: string;
  title: string;
  category: RoadmapCategory;
  description: string;
  topicCount: number;
  topics: RoadmapTopic[];
  sourceUrl: string;
};

export const roadmapCatalog: Roadmap[] = 
[
  {
    "slug": "frontend",
    "title": "Frontend",
    "category": "role",
    "description": "A practical path for becoming a stronger Frontend practitioner, from fundamentals to production-ready work.",
    "topicCount": 121,
    "topics": [
      {
        "id": "accessibility@e-k6EhoxYG9h0x6vWOrDh",
        "title": "Accessibility",
        "slug": "accessibility",
        "summary": "Website accessibility ensures sites are usable by everyone, including people with disabilities. Involves alt text for images, keyboard navigation, color contrast, and captions. Benefits all users, supports legal complian",
        "sourcePath": "developer-roadmap/roadmaps/frontend/content/accessibility@e-k6EhoxYG9h0x6vWOrDh.md"
      },
      {
        "id": "agents@e4j6u0e_WqK1vfrUwJJ4M",
        "title": "AI Agents",
        "slug": "agents",
        "summary": "AI agents are autonomous programs designed to help developers write code more efficiently. These agents can automate repetitive tasks, suggest code completions, identify errors, and even generate entire code blocks based",
        "sourcePath": "developer-roadmap/roadmaps/frontend/content/agents@e4j6u0e_WqK1vfrUwJJ4M.md"
      },
      {
        "id": "ai-assisted-coding@ipcNHz8KbfpE57kNP15hP",
        "title": "AI-Assisted Coding",
        "slug": "ai-assisted-coding",
        "summary": "AI-assisted coding involves using artificial intelligence tools to help developers write code more efficiently and effectively. These tools can provide real-time suggestions, automate repetitive tasks, identify potential",
        "sourcePath": "developer-roadmap/roadmaps/frontend/content/ai-assisted-coding@ipcNHz8KbfpE57kNP15hP.md"
      },
      {
        "id": "ai-vs-traditional-coding@IZKl6PxbvgNkryAkdy3-p",
        "title": "AI vs. Traditional Software Development",
        "slug": "ai-vs-traditional-coding",
        "summary": "Traditional software development relies on developers explicitly writing code to instruct computers on how to perform tasks. This involves defining every step and logic manually. AI-assisted coding, however, leverages ma",
        "sourcePath": "developer-roadmap/roadmaps/frontend/content/ai-vs-traditional-coding@IZKl6PxbvgNkryAkdy3-p.md"
      },
      {
        "id": "angular@-bHFIiXnoUQSov64WI9yo",
        "title": "Angular",
        "slug": "angular",
        "summary": "Angular is Google's TypeScript framework for building single-page applications (SPAs). Features reusable components, two-way data binding, dependency injection, and robust template system. Includes testing tools, routing",
        "sourcePath": "developer-roadmap/roadmaps/frontend/content/angular@-bHFIiXnoUQSov64WI9yo.md"
      },
      {
        "id": "angular@k6rp6Ua9qUEW_DA_fOg5u",
        "title": "Angular",
        "slug": "angular",
        "summary": "Angular is a popular tool from Google for building websites and web apps. It uses TypeScript (a type of JavaScript) to create large, efficient single-page applications (SPAs), where content loads in one go without needin",
        "sourcePath": "developer-roadmap/roadmaps/frontend/content/angular@k6rp6Ua9qUEW_DA_fOg5u.md"
      },
      {
        "id": "anthropic@Lw2nR7x8PYgq1P5CxPAxi",
        "title": "Anthropic",
        "slug": "anthropic",
        "summary": "Anthropic is an AI safety and research company focused on developing reliable, interpretable, and steerable AI systems. They create AI models, like Claude, that are designed to be helpful, harmless, and honest, prioritiz",
        "sourcePath": "developer-roadmap/roadmaps/frontend/content/anthropic@Lw2nR7x8PYgq1P5CxPAxi.md"
      },
      {
        "id": "antigravity@E7-LveK7jO2npxVTLUDfw",
        "title": "Antigravity",
        "slug": "antigravity",
        "summary": "Antigravity is an AI-powered code completion tool designed to enhance developer productivity. Created by Google, it learns from your coding style and project context to provide intelligent suggestions, autocompletions, a",
        "sourcePath": "developer-roadmap/roadmaps/frontend/content/antigravity@E7-LveK7jO2npxVTLUDfw.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/frontend"
  },
  {
    "slug": "backend",
    "title": "Backend",
    "category": "role",
    "description": "A practical path for becoming a stronger Backend practitioner, from fundamentals to production-ready work.",
    "topicCount": 156,
    "topics": [
      {
        "id": "acid@qSAdfaGUfn8mtmDjHJi3z",
        "title": "ACID",
        "slug": "acid",
        "summary": "ACID represents four database transaction properties: Atomicity (all-or-nothing execution), Consistency (valid state maintenance), Isolation (concurrent transaction separation), and Durability (permanent commit survival)",
        "sourcePath": "developer-roadmap/roadmaps/backend/content/acid@qSAdfaGUfn8mtmDjHJi3z.md"
      },
      {
        "id": "agents@w1D3-bSg93ndKK9XJTu7z",
        "title": "AI Agents",
        "slug": "agents",
        "summary": "AI agents are autonomous programs designed to help developers write code more efficiently. These agents can automate repetitive tasks, suggest code completions, identify errors, and even generate entire code blocks based",
        "sourcePath": "developer-roadmap/roadmaps/backend/content/agents@w1D3-bSg93ndKK9XJTu7z.md"
      },
      {
        "id": "ai-assisted-coding@fA3yi9puMbTFmbPpo6OjN",
        "title": "AI-Assisted Coding",
        "slug": "ai-assisted-coding",
        "summary": "AI-assisted coding involves using artificial intelligence tools to help developers write code more efficiently and effectively. These tools can provide real-time suggestions, automate repetitive tasks, identify potential",
        "sourcePath": "developer-roadmap/roadmaps/backend/content/ai-assisted-coding@fA3yi9puMbTFmbPpo6OjN.md"
      },
      {
        "id": "ai-vs-traditional-coding@IZKl6PxbvgNkryAkdy3-p",
        "title": "AI vs. Traditional Software Development",
        "slug": "ai-vs-traditional-coding",
        "summary": "Traditional software development relies on developers explicitly writing code to instruct computers on how to perform tasks. This involves defining every step and logic manually. AI-assisted coding, however, leverages ma",
        "sourcePath": "developer-roadmap/roadmaps/backend/content/ai-vs-traditional-coding@IZKl6PxbvgNkryAkdy3-p.md"
      },
      {
        "id": "anthropic@Lw2nR7x8PYgq1P5CxPAxi",
        "title": "Anthropic",
        "slug": "anthropic",
        "summary": "Anthropic is an AI safety and research company focused on developing reliable, interpretable, and steerable AI systems. They create AI models, like Claude, that are designed to be helpful, harmless, and honest, prioritiz",
        "sourcePath": "developer-roadmap/roadmaps/backend/content/anthropic@Lw2nR7x8PYgq1P5CxPAxi.md"
      },
      {
        "id": "antigravity@E7-LveK7jO2npxVTLUDfw",
        "title": "Antigravity",
        "slug": "antigravity",
        "summary": "Antigravity is an AI-powered code completion tool designed to enhance developer productivity. It learns from your coding style and project context to provide intelligent suggestions, autocompletions, and code generation ",
        "sourcePath": "developer-roadmap/roadmaps/backend/content/antigravity@E7-LveK7jO2npxVTLUDfw.md"
      },
      {
        "id": "apache@jjjonHTHHo-NiAf6p9xPv",
        "title": "Apache",
        "slug": "apache",
        "summary": "Apache HTTP Server is a popular open-source web server known for flexibility and extensive features. It supports multiple OS platforms, offers virtual hosting, SSL/TLS, and modular architecture. Part of the LAMP stack, i",
        "sourcePath": "developer-roadmap/roadmaps/backend/content/apache@jjjonHTHHo-NiAf6p9xPv.md"
      },
      {
        "id": "applications@Nx7mjvYgqLpmJ0_iSx5of",
        "title": "AI Applications in Software Development",
        "slug": "applications",
        "summary": "AI is increasingly utilized to enhance various software development tasks, like automatically creating code snippets based on specifications. It also improves existing code by suggesting better ways to rewrite it and by ",
        "sourcePath": "developer-roadmap/roadmaps/backend/content/applications@Nx7mjvYgqLpmJ0_iSx5of.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/backend"
  },
  {
    "slug": "full-stack",
    "title": "Full Stack",
    "category": "role",
    "description": "A practical path for becoming a stronger Full Stack practitioner, from fundamentals to production-ready work.",
    "topicCount": 37,
    "topics": [
      {
        "id": "ansible@rFXupYpUFfp7vZO8zh614",
        "title": "Ansible",
        "slug": "ansible",
        "summary": "Ansible is an open-source configuration management, application deployment and provisioning tool that uses its own declarative language in YAML. Ansible is agentless, meaning you only need remote connections via SSH or W",
        "sourcePath": "developer-roadmap/roadmaps/full-stack/content/ansible@rFXupYpUFfp7vZO8zh614.md"
      },
      {
        "id": "basic-aws-services@cUOfvOlQ_0Uu1VX3i67kJ",
        "title": "Basic AWS Services",
        "slug": "basic-aws-services",
        "summary": "AWS has several services but you don't need to know all of them. Some common ones that you can start with are EC2, VPC, S3, Route 53, and SES.",
        "sourcePath": "developer-roadmap/roadmaps/full-stack/content/basic-aws-services@cUOfvOlQ_0Uu1VX3i67kJ.md"
      },
      {
        "id": "checkpoint---collaborative-work@zFGWxgLPcZoW7KIzlnSV9",
        "title": "Checkpoint",
        "slug": "checkpoint---collaborative-work",
        "summary": "Now that you have learnt git and GitHub you should be ready to work with others. You should now setup your GitHub profile and push all the projects that you have built so far to your GitHub profile. Here are some of my r",
        "sourcePath": "developer-roadmap/roadmaps/full-stack/content/checkpoint---collaborative-work@zFGWxgLPcZoW7KIzlnSV9.md"
      },
      {
        "id": "checkpoint---external-packages@R4aeJNOrfWyVp3ea-qF4H",
        "title": "Checkpoint",
        "slug": "checkpoint---external-packages",
        "summary": "At this point, you should be able to install and use external packages using `npm`. You probably know about [npmjs.com](https://npmjs.com/) where you can search for packages and read their documentation. You should also ",
        "sourcePath": "developer-roadmap/roadmaps/full-stack/content/checkpoint---external-packages@R4aeJNOrfWyVp3ea-qF4H.md"
      },
      {
        "id": "checkpoint---frontend-apps@7JU1cVggMDoZUV-adGsf-",
        "title": "Checkpoint",
        "slug": "checkpoint---frontend-apps",
        "summary": "At this point you should be able to build a complete frontend application including:",
        "sourcePath": "developer-roadmap/roadmaps/full-stack/content/checkpoint---frontend-apps@7JU1cVggMDoZUV-adGsf-.md"
      },
      {
        "id": "checkpoint---interactivity@2DFzoIUjKdAKGjfu_SCfa",
        "title": "Checkpoint",
        "slug": "checkpoint---interactivity",
        "summary": "At this point you should be able to add interactivity to your web pages using JavaScript. You should make sure that you have learnt the following:",
        "sourcePath": "developer-roadmap/roadmaps/full-stack/content/checkpoint---interactivity@2DFzoIUjKdAKGjfu_SCfa.md"
      },
      {
        "id": "checkpoint---static-webpages@WsdUAEaI7FX6DKKhPXUHp",
        "title": "Checkpoint",
        "slug": "checkpoint---static-webpages",
        "summary": "Now that you have learnt HTML and CSS, you should be able to build static webpages. I recommend you to build as many test projects at each yellow step of the roadmap as possible to solidify what you learn.",
        "sourcePath": "developer-roadmap/roadmaps/full-stack/content/checkpoint---static-webpages@WsdUAEaI7FX6DKKhPXUHp.md"
      },
      {
        "id": "checkpoint--automation@sO_9-l4FECbaqiaFnyeXO",
        "title": "Checkpoint",
        "slug": "checkpoint--automation",
        "summary": "Now that you have learnt ansible, you can use it to automate the deployment of your application.",
        "sourcePath": "developer-roadmap/roadmaps/full-stack/content/checkpoint--automation@sO_9-l4FECbaqiaFnyeXO.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/full-stack"
  },
  {
    "slug": "devops",
    "title": "DevOps",
    "category": "role",
    "description": "A practical path for becoming a stronger DevOps practitioner, from fundamentals to production-ready work.",
    "topicCount": 138,
    "topics": [
      {
        "id": "alibaba-cloud@YUJf-6ccHvYjL_RzufQ-G",
        "title": "Alibaba Cloud",
        "slug": "alibaba-cloud",
        "summary": "Alibaba Cloud is a global cloud computing platform that provides a comprehensive suite of services, including elastic computing, database management, networking, and security solutions. It operates a vast infrastructure ",
        "sourcePath": "developer-roadmap/roadmaps/devops/content/alibaba-cloud@YUJf-6ccHvYjL_RzufQ-G.md"
      },
      {
        "id": "ansible@h9vVPOmdUSeEGVQQaSTH5",
        "title": "Ansible",
        "slug": "ansible",
        "summary": "Ansible is an open-source automation tool used for configuration management, application deployment, and task orchestration. It operates as an agentless system, connecting to remote servers via SSH or WinRM to execute ta",
        "sourcePath": "developer-roadmap/roadmaps/devops/content/ansible@h9vVPOmdUSeEGVQQaSTH5.md"
      },
      {
        "id": "apache@0_GMTcMeZv3A8dYkHRoW7",
        "title": "Apache",
        "slug": "apache",
        "summary": "Apache HTTP Server is an open-source web server software that powers a significant portion of the websites on the internet. It works by processing incoming requests from clients and delivering the requested web content, ",
        "sourcePath": "developer-roadmap/roadmaps/devops/content/apache@0_GMTcMeZv3A8dYkHRoW7.md"
      },
      {
        "id": "argocd@i-DLwNXdCUUug6lfjkPSy",
        "title": "ArgoCD",
        "slug": "argocd",
        "summary": "Argo CD is a declarative GitOps continuous delivery tool for Kubernetes. It monitors Git repositories for changes to application manifests and automatically syncs those changes to the target cluster, providing a visual d",
        "sourcePath": "developer-roadmap/roadmaps/devops/content/argocd@i-DLwNXdCUUug6lfjkPSy.md"
      },
      {
        "id": "artifact-management@zuBAjrqQPjj-0DHGjCaqT",
        "title": "Artifact Management",
        "slug": "artifact-management",
        "summary": "Artifact management refers to the storage, versioning, and distribution of build artifacts, such as compiled binaries, container images, libraries, and packages, produced during the software development lifecycle. A dedi",
        "sourcePath": "developer-roadmap/roadmaps/devops/content/artifact-management@zuBAjrqQPjj-0DHGjCaqT.md"
      },
      {
        "id": "artifactory@C_sFyIsIIpriZlovvcbSE",
        "title": "Artifactory",
        "slug": "artifactory",
        "summary": "Artifactory is a universal artifact repository manager developed by JFrog that supports virtually every major package format. It integrates deeply with CI/CD tools, provides fine-grained access controls, and includes fea",
        "sourcePath": "developer-roadmap/roadmaps/devops/content/artifactory@C_sFyIsIIpriZlovvcbSE.md"
      },
      {
        "id": "availability@JCe3fcOf-sokTJURyX1oI",
        "title": "Availability",
        "slug": "availability",
        "summary": "Availability patterns are design approaches that ensure a system remains operational and accessible even in the face of failures. They include techniques such as health endpoint monitoring, queue-based load leveling, and",
        "sourcePath": "developer-roadmap/roadmaps/devops/content/availability@JCe3fcOf-sokTJURyX1oI.md"
      },
      {
        "id": "aws-cdk@XA__697KgofsH28coQ-ma",
        "title": "AWS CDK",
        "slug": "aws-cdk",
        "summary": "The AWS Cloud Development Kit (AWS CDK) is an open-source software development framework used to provision cloud infrastructure resources in a safe, repeatable manner through AWS CloudFormation. AWS CDK offers the flexib",
        "sourcePath": "developer-roadmap/roadmaps/devops/content/aws-cdk@XA__697KgofsH28coQ-ma.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/devops"
  },
  {
    "slug": "ai-engineer",
    "title": "Ai Engineer",
    "category": "role",
    "description": "A practical path for becoming a stronger Ai Engineer practitioner, from fundamentals to production-ready work.",
    "topicCount": 194,
    "topics": [
      {
        "id": "adding-end-user-ids-in-prompts@4Q5x2VCXedAWISBXUIyin",
        "title": "Adding end-user IDs in prompts",
        "slug": "adding-end-user-ids-in-prompts",
        "summary": "Sending end-user IDs in your requests can be a useful tool to help OpenAI monitor and detect abuse. This allows OpenAI to provide your team with more actionable feedback in the event that we detect any policy violations ",
        "sourcePath": "developer-roadmap/roadmaps/ai-engineer/content/adding-end-user-ids-in-prompts@4Q5x2VCXedAWISBXUIyin.md"
      },
      {
        "id": "agents-usecases@778HsQzTuJ_3c9OSn5DmH",
        "title": "Agents Use Cases",
        "slug": "agents-usecases",
        "summary": "AI Agents have a variety of use cases ranging from customer support, workflow automation, cybersecurity, finance, marketing, and sales, and more.",
        "sourcePath": "developer-roadmap/roadmaps/ai-engineer/content/agents-usecases@778HsQzTuJ_3c9OSn5DmH.md"
      },
      {
        "id": "ai-agents@4_ap0rD9Gl6Ep_4jMfPpG",
        "title": "AI Agents",
        "slug": "ai-agents",
        "summary": "In AI engineering, \"agents\" refer to autonomous systems or components that can perceive their environment, make decisions, and take actions to achieve specific goals. Agents often interact with external systems, users, o",
        "sourcePath": "developer-roadmap/roadmaps/ai-engineer/content/ai-agents@4_ap0rD9Gl6Ep_4jMfPpG.md"
      },
      {
        "id": "ai-agents@Uffu609uQbIzDl88Ddccv",
        "title": "AI Agents",
        "slug": "ai-agents",
        "summary": "In AI engineering, \"agents\" refer to autonomous systems or components that can perceive their environment, make decisions, and take actions to achieve specific goals. Agents often interact with external systems, users, o",
        "sourcePath": "developer-roadmap/roadmaps/ai-engineer/content/ai-agents@Uffu609uQbIzDl88Ddccv.md"
      },
      {
        "id": "ai-engineer-vs-ml-engineer@jSZ1LhPdhlkW-9QJhIvFs",
        "title": "AI Engineer vs ML Engineer",
        "slug": "ai-engineer-vs-ml-engineer",
        "summary": "An AI Engineer uses pre-trained models and existing AI tools to improve user experiences. They focus on applying AI in practical ways, without building models from scratch. This is different from AI Researchers and ML En",
        "sourcePath": "developer-roadmap/roadmaps/ai-engineer/content/ai-engineer-vs-ml-engineer@jSZ1LhPdhlkW-9QJhIvFs.md"
      },
      {
        "id": "ai-safety-and-ethics@8ndKHDJgL_gYwaXC7XMer",
        "title": "AI Safety and Ethics",
        "slug": "ai-safety-and-ethics",
        "summary": "AI safety and ethics involve establishing guidelines and best practices to ensure that artificial intelligence systems are developed, deployed, and used in a manner that prioritizes human well-being, fairness, and transp",
        "sourcePath": "developer-roadmap/roadmaps/ai-engineer/content/ai-safety-and-ethics@8ndKHDJgL_gYwaXC7XMer.md"
      },
      {
        "id": "ai-vs-agi@5QdihE1lLpMc3DFrGy46M",
        "title": "AI vs AGI",
        "slug": "ai-vs-agi",
        "summary": "AI (Artificial Intelligence) refers to systems designed to perform specific tasks by mimicking aspects of human intelligence, such as pattern recognition, decision-making, and language processing. These systems, known as",
        "sourcePath": "developer-roadmap/roadmaps/ai-engineer/content/ai-vs-agi@5QdihE1lLpMc3DFrGy46M.md"
      },
      {
        "id": "anomaly-detection@AglWJ7gb9rTT2rMkstxtk",
        "title": "Anomaly Detection",
        "slug": "anomaly-detection",
        "summary": "Anomaly detection with embeddings works by transforming data, such as text, images, or time-series data, into vector representations that capture their patterns and relationships. In this high-dimensional space, similar ",
        "sourcePath": "developer-roadmap/roadmaps/ai-engineer/content/anomaly-detection@AglWJ7gb9rTT2rMkstxtk.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/ai-engineer"
  },
  {
    "slug": "ai-data-scientist",
    "title": "AI and Data Scientist",
    "category": "role",
    "description": "A practical path for becoming a stronger AI and Data Scientist practitioner, from fundamentals to production-ready work.",
    "topicCount": 9,
    "topics": [
      {
        "id": "coding@XLDWuSt4tI4gnmqMFdpmy",
        "title": "Coding",
        "slug": "coding",
        "summary": "Programming is a fundamental skill for data scientists. You need to be able to write code to manipulate data, build models, and deploy solutions. The most common programming languages used in data science are Python and ",
        "sourcePath": "developer-roadmap/roadmaps/ai-data-scientist/content/coding@XLDWuSt4tI4gnmqMFdpmy.md"
      },
      {
        "id": "deep-learning@cjvVLN0XjrKPn6o20oMmc",
        "title": "Deep Learning",
        "slug": "deep-learning",
        "summary": "Deep Learning is a subset of machine learning that uses artificial neural networks with multiple layers (hence \"deep\") to analyze data and learn complex patterns. These networks are inspired by the structure and function",
        "sourcePath": "developer-roadmap/roadmaps/ai-data-scientist/content/deep-learning@cjvVLN0XjrKPn6o20oMmc.md"
      },
      {
        "id": "econometrics@Gd2egqKZPnbPW1W2jw4j8",
        "title": "Econometrics",
        "slug": "econometrics",
        "summary": "Econometrics is the application of statistical methods to economic data. It is a branch of economics that aims to give empirical content to economic relations. More precisely, it is \"the quantitative analysis of actual e",
        "sourcePath": "developer-roadmap/roadmaps/ai-data-scientist/content/econometrics@Gd2egqKZPnbPW1W2jw4j8.md"
      },
      {
        "id": "exploratory-data-analysis@l1027SBZxTHKzqWw98Ee-",
        "title": "Exploratory Data Analysis",
        "slug": "exploratory-data-analysis",
        "summary": "Exploratory Data Analysis (EDA) is an approach to analyzing data sets to summarize their main characteristics, often with visual methods. EDA is used to understand what the data can tell us beyond the formal modeling or ",
        "sourcePath": "developer-roadmap/roadmaps/ai-data-scientist/content/exploratory-data-analysis@l1027SBZxTHKzqWw98Ee-.md"
      },
      {
        "id": "index",
        "title": "Index",
        "slug": "index",
        "summary": "Explore the core ideas behind Index.",
        "sourcePath": "developer-roadmap/roadmaps/ai-data-scientist/content/index.md"
      },
      {
        "id": "machine-learning@kBdt_t2SvVsY3blfubWIz",
        "title": "Machine Learning",
        "slug": "machine-learning",
        "summary": "Machine learning involves creating algorithms that allow computer systems to learn from data without being explicitly programmed. These algorithms identify patterns, make predictions, and improve their performance over t",
        "sourcePath": "developer-roadmap/roadmaps/ai-data-scientist/content/machine-learning@kBdt_t2SvVsY3blfubWIz.md"
      },
      {
        "id": "mathematics@aStaDENn5PhEa-cFvNzXa",
        "title": "Mathematics",
        "slug": "mathematics",
        "summary": "Mathematics provides the foundational language and tools for understanding and building algorithms. It encompasses concepts like linear algebra (for manipulating data), calculus (for optimization), probability and statis",
        "sourcePath": "developer-roadmap/roadmaps/ai-data-scientist/content/mathematics@aStaDENn5PhEa-cFvNzXa.md"
      },
      {
        "id": "mlops@Qa85hEVe2kz62k9Pj4QCA",
        "title": "MLOps",
        "slug": "mlops",
        "summary": "MLOps is a practice for collaboration and communication between data scientists and operations professionals to help manage the production ML lifecycle. It is a set of best practices that aims to automate the ML lifecycl",
        "sourcePath": "developer-roadmap/roadmaps/ai-data-scientist/content/mlops@Qa85hEVe2kz62k9Pj4QCA.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/ai-data-scientist"
  },
  {
    "slug": "data-engineer",
    "title": "Data Engineer",
    "category": "role",
    "description": "A practical path for becoming a stronger Data Engineer practitioner, from fundamentals to production-ready work.",
    "topicCount": 190,
    "topics": [
      {
        "id": "ab-testing@5qe0q_llTzzNVudbONMYo",
        "title": "A/B Testing",
        "slug": "ab-testing",
        "summary": "A/B testing is a way to compare two versions of something to see which one works better. You split your audience into two groups, one sees version A, the other sees version B — and then you measure which version gets bet",
        "sourcePath": "developer-roadmap/roadmaps/data-engineer/content/ab-testing@5qe0q_llTzzNVudbONMYo.md"
      },
      {
        "id": "amazon-ec2--compute@AHLsBfPfBJOhLlJ-64GcK",
        "title": "Amazon EC2 (Compute)",
        "slug": "amazon-ec2--compute",
        "summary": "Amazon EC2 (Elastic Compute Cloud) provides virtual servers in the AWS cloud. Users can choose instance types optimized for compute, memory, or storage, and pay only for what they run. EC2 is used for running data proces",
        "sourcePath": "developer-roadmap/roadmaps/data-engineer/content/amazon-ec2--compute@AHLsBfPfBJOhLlJ-64GcK.md"
      },
      {
        "id": "amazon-rds-database@GtFk7phYGfXUhxanicYNQ",
        "title": "Amazon RDS (Database)",
        "slug": "amazon-rds-database",
        "summary": "Amazon RDS (Relational Database Service) is a managed relational database service from AWS that supports MySQL, PostgreSQL, MariaDB, Oracle, and MS SQL Server. It handles provisioning, backups, patching, and replication ",
        "sourcePath": "developer-roadmap/roadmaps/data-engineer/content/amazon-rds-database@GtFk7phYGfXUhxanicYNQ.md"
      },
      {
        "id": "amazon-rds-database@nD36-PXHzOXePM7j9u_O_",
        "title": "Amazon RDS (Database)",
        "slug": "amazon-rds-database",
        "summary": "Amazon RDS (Relational Database Service) is a web service from Amazon Web Services. It's designed to simplify the setup, operation, and scaling of relational databases in the cloud. This service provides cost-efficient, ",
        "sourcePath": "developer-roadmap/roadmaps/data-engineer/content/amazon-rds-database@nD36-PXHzOXePM7j9u_O_.md"
      },
      {
        "id": "amazon-redshift@omrg8QcYmTdQLBKV47b7o",
        "title": "Amazon Redshift",
        "slug": "amazon-redshift",
        "summary": "Amazon Redshift is a cloud-based data warehouse service from Amazon that lets you store and analyze large amounts of data quickly. It’s designed for running complex queries on huge datasets, so businesses can use it to t",
        "sourcePath": "developer-roadmap/roadmaps/data-engineer/content/amazon-redshift@omrg8QcYmTdQLBKV47b7o.md"
      },
      {
        "id": "apache-airflow@vfO5Dz6ppsNtbGiQwpUs7",
        "title": "Apache Airflow",
        "slug": "apache-airflow",
        "summary": "Apache Airflow is an open-source tool that helps you schedule, organize, and monitor workflows. Think of it like a to-do list for your data tasks, but smarter — you can set tasks to run in a specific order, track their p",
        "sourcePath": "developer-roadmap/roadmaps/data-engineer/content/apache-airflow@vfO5Dz6ppsNtbGiQwpUs7.md"
      },
      {
        "id": "apache-hadoop-yarn@pjm_qShAiFk3JsX4Z2d8G",
        "title": "Apache Hadoop YARN",
        "slug": "apache-hadoop-yarn",
        "summary": "Apache Hadoop YARN (Yet Another Resource Negotiator) is the part of Hadoop that manages resources and runs jobs on a cluster. It has a ResourceManager that controls all cluster resources and an ApplicationMaster for each",
        "sourcePath": "developer-roadmap/roadmaps/data-engineer/content/apache-hadoop-yarn@pjm_qShAiFk3JsX4Z2d8G.md"
      },
      {
        "id": "apache-kafka@fTpx6m8U0506ZLCdDU5OG",
        "title": "Apache Kafka",
        "slug": "apache-kafka",
        "summary": "Apache Kafka is an open-source stream-processing software platform developed by LinkedIn and donated to the Apache Software Foundation. It is written in Scala and Java and operates based on a message queue, designed to h",
        "sourcePath": "developer-roadmap/roadmaps/data-engineer/content/apache-kafka@fTpx6m8U0506ZLCdDU5OG.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/data-engineer"
  },
  {
    "slug": "data-analyst",
    "title": "Data Analyst",
    "category": "role",
    "description": "A practical path for becoming a stronger Data Analyst practitioner, from fundamentals to production-ready work.",
    "topicCount": 102,
    "topics": [
      {
        "id": "analysis--reporting-with-excel@sgXIjVTbwdwdYoaxN3XBM",
        "title": "Excel",
        "slug": "analysis--reporting-with-excel",
        "summary": "Excel is a powerful tool utilized by data analysts worldwide to store, manipulate, and analyze data. It offers a vast array of features such as pivot tables, graphs and a powerful suite of formulas and functions to help ",
        "sourcePath": "developer-roadmap/roadmaps/data-analyst/content/analysis--reporting-with-excel@sgXIjVTbwdwdYoaxN3XBM.md"
      },
      {
        "id": "apis@4DFcXSSHxg5wv0uXLIRij",
        "title": "APIs and Data Collection",
        "slug": "apis",
        "summary": "Application Programming Interfaces, better known as APIs, play a fundamental role in the work of data analysts, particularly in the process of data collection. APIs are sets of protocols, routines, and tools that enable ",
        "sourcePath": "developer-roadmap/roadmaps/data-analyst/content/apis@4DFcXSSHxg5wv0uXLIRij.md"
      },
      {
        "id": "average@FDYunL9KJkR_tHEcUV2iC",
        "title": "Average",
        "slug": "average",
        "summary": "The average, also often referred to as the mean, is one of the most commonly used mathematical calculations in data analysis. It provides a simple, useful measure of a set of data. For a data analyst, understanding how t",
        "sourcePath": "developer-roadmap/roadmaps/data-analyst/content/average@FDYunL9KJkR_tHEcUV2iC.md"
      },
      {
        "id": "bar-charts@EVk1H-QLtTlpG7lVEenDt",
        "title": "Bar Charts",
        "slug": "bar-charts",
        "summary": "Bar charts display categorical data with rectangular bars whose lengths represent values. They are used to compare quantities across different categories. Horizontal bar charts work well for long category names; vertical",
        "sourcePath": "developer-roadmap/roadmaps/data-analyst/content/bar-charts@EVk1H-QLtTlpG7lVEenDt.md"
      },
      {
        "id": "big-data-concepts@m1IfG2sEedUxMXrv_B8GW",
        "title": "Big Data Concepts",
        "slug": "big-data-concepts",
        "summary": "Big data concepts describe the properties and challenges of working with very large datasets. The three Vs (volume, velocity, variety) capture the main dimensions: how much data there is, how fast it arrives, and how man",
        "sourcePath": "developer-roadmap/roadmaps/data-analyst/content/big-data-concepts@m1IfG2sEedUxMXrv_B8GW.md"
      },
      {
        "id": "big-data-technologies@_aUQZWUhFRvNu0MZ8CPit",
        "title": "Big Data Technologies",
        "slug": "big-data-technologies",
        "summary": "Big data technologies handle datasets that are too large or complex for traditional tools to process. The defining characteristics of big data are often described as volume, velocity, and variety. Distributed processing ",
        "sourcePath": "developer-roadmap/roadmaps/data-analyst/content/big-data-technologies@_aUQZWUhFRvNu0MZ8CPit.md"
      },
      {
        "id": "central-tendency@BJTVa4ur_bJB7mMtD2-hQ",
        "title": "Central Tendency",
        "slug": "central-tendency",
        "summary": "Measures of central tendency describe the center or typical value of a dataset. The three main measures are mean (arithmetic average), median (middle value), and mode (most frequent value). The choice between them depend",
        "sourcePath": "developer-roadmap/roadmaps/data-analyst/content/central-tendency@BJTVa4ur_bJB7mMtD2-hQ.md"
      },
      {
        "id": "charting@Vk3JErqxpnPY44iyfkLMl",
        "title": "Charting",
        "slug": "charting",
        "summary": "Excel charts turn tabular data into visual representations like bar charts, line charts, pie charts, and scatter plots. Charts are created directly from selected data and can be formatted and embedded in reports and dash",
        "sourcePath": "developer-roadmap/roadmaps/data-analyst/content/charting@Vk3JErqxpnPY44iyfkLMl.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/data-analyst"
  },
  {
    "slug": "python",
    "title": "Python",
    "category": "skill",
    "description": "A focused learning path for mastering Python, with concepts, tools, projects, and next steps.",
    "topicCount": 85,
    "topics": [
      {
        "id": "aiohttp@IBVAvFtN4mnIPbIuyUvEb",
        "title": "AIOHTTP",
        "slug": "aiohttp",
        "summary": "aiohttp is a Python 3.5+ library that provides a simple and powerful asynchronous HTTP client and server implementation.",
        "sourcePath": "developer-roadmap/roadmaps/python/content/aiohttp@IBVAvFtN4mnIPbIuyUvEb.md"
      },
      {
        "id": "arrays-and-linked-lists@OPD4WdMO7q4gRZMcRCQh1",
        "title": "Arrays and Linked lists",
        "slug": "arrays-and-linked-lists",
        "summary": "Arrays store elements in contiguous memory locations, resulting in easily calculable addresses for the elements stored and this allows faster access to an element at a specific index. Linked lists are less rigid in their",
        "sourcePath": "developer-roadmap/roadmaps/python/content/arrays-and-linked-lists@OPD4WdMO7q4gRZMcRCQh1.md"
      },
      {
        "id": "asynchrony@Mow7RvropbC4ZGDpcGZmw",
        "title": "Asynchrony",
        "slug": "asynchrony",
        "summary": "Asynchronous programming, supported by asyncio, allows code to be executed without blocking, using async and await. This is especially useful for I/O tasks such as networking or file manipulation, allowing thousands of c",
        "sourcePath": "developer-roadmap/roadmaps/python/content/asynchrony@Mow7RvropbC4ZGDpcGZmw.md"
      },
      {
        "id": "basic-syntax@6xRncUs3_vxVbDur567QA",
        "title": "Basic Syntax",
        "slug": "basic-syntax",
        "summary": "Setup the environment for python and get started with the basics.",
        "sourcePath": "developer-roadmap/roadmaps/python/content/basic-syntax@6xRncUs3_vxVbDur567QA.md"
      },
      {
        "id": "binary-search-tree@uJIqgsqUbE62Tyo3K75Qx",
        "title": "Binary Search Trees",
        "slug": "binary-search-tree",
        "summary": "A binary search tree, also called an ordered or sorted binary tree, is a rooted binary tree data structure with the key of each internal node being greater than all the keys in the respective node's left subtree and less",
        "sourcePath": "developer-roadmap/roadmaps/python/content/binary-search-tree@uJIqgsqUbE62Tyo3K75Qx.md"
      },
      {
        "id": "black@DS6nuAUhUYcqiJDmQisKM",
        "title": "black",
        "slug": "black",
        "summary": "Black is a python code formatter that automatically formats code according to a consistent style. By removing formatting decisions from developers, Black helps maintain uniform codebases, improves readability, and reduce",
        "sourcePath": "developer-roadmap/roadmaps/python/content/black@DS6nuAUhUYcqiJDmQisKM.md"
      },
      {
        "id": "builtin@08XifLQ20c4FKI_4AWNBQ",
        "title": "Builtin Modules",
        "slug": "builtin",
        "summary": "Python has a rich standard library of built-in modules that provide a wide range of functionality. Some of the most commonly used built-in modules include: sys, os, math, datetime, random, re, itertools, etc.",
        "sourcePath": "developer-roadmap/roadmaps/python/content/builtin@08XifLQ20c4FKI_4AWNBQ.md"
      },
      {
        "id": "classes@AqwzR8dZKLQIoj_6KKZ3t",
        "title": "Classes",
        "slug": "classes",
        "summary": "A class is a user-defined blueprint or prototype from which objects are created. Classes provide a means of bundling data and functionality together. Creating a new class creates a new type of object, allowing new instan",
        "sourcePath": "developer-roadmap/roadmaps/python/content/classes@AqwzR8dZKLQIoj_6KKZ3t.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/python"
  },
  {
    "slug": "javascript",
    "title": "Javascript",
    "category": "skill",
    "description": "A focused learning path for mastering Javascript, with concepts, tools, projects, and next steps.",
    "topicCount": 126,
    "topics": [
      {
        "id": "@RonBj1htt6jnBt3W7zoTA",
        "title": "==",
        "slug": "",
        "summary": "The `==` operator compares two values for equality after performing type coercion if the types differ. For example, `\"5\" == 5` returns `true` because the string is converted to a number before comparison. This can produc",
        "sourcePath": "developer-roadmap/roadmaps/javascript/content/@RonBj1htt6jnBt3W7zoTA.md"
      },
      {
        "id": "@lJwcc6JoUIQoiQ6FkV2KW",
        "title": "===",
        "slug": "",
        "summary": "The `===` operator compares two values for equality without type coercion. Both the value and the type must match for the comparison to return `true`. It is the recommended equality operator for most cases because it pro",
        "sourcePath": "developer-roadmap/roadmaps/javascript/content/@lJwcc6JoUIQoiQ6FkV2KW.md"
      },
      {
        "id": "all-about-variables@kvActjpU4FUJdrmuFoFEe",
        "title": "All about Variables",
        "slug": "all-about-variables",
        "summary": "Variables are named containers for storing data values in a program. In JavaScript, variables are declared using `var`, `let`, or `const`, each with different scoping and reassignment rules. Choosing the right declaratio",
        "sourcePath": "developer-roadmap/roadmaps/javascript/content/all-about-variables@kvActjpU4FUJdrmuFoFEe.md"
      },
      {
        "id": "apply@-BtF34cEzI6J8sZCDRlRE",
        "title": "apply",
        "slug": "apply",
        "summary": "The apply() method of Function instances calls this function with a given this value, and arguments provided as an array (or an array-like object).",
        "sourcePath": "developer-roadmap/roadmaps/javascript/content/apply@-BtF34cEzI6J8sZCDRlRE.md"
      },
      {
        "id": "arguments-object@QLC7bW-qHskLH2HOA-Sko",
        "title": "Arguments object",
        "slug": "arguments-object",
        "summary": "The arguments object is an Array-like object accessible inside functions that contains the values of the arguments passed to that function, available within all non-arrow functions. You can refer to a function's argument",
        "sourcePath": "developer-roadmap/roadmaps/javascript/content/arguments-object@QLC7bW-qHskLH2HOA-Sko.md"
      },
      {
        "id": "arithmetic-operators@0PK1NwlgkNe2Vf-We4uLH",
        "title": "Arithmetic Operators",
        "slug": "arithmetic-operators",
        "summary": "Arithmetic operators perform mathematical operations on numbers. They include `+` (addition), `-` (subtraction), `*` (multiplication), `/` (division), `%` (remainder), and `**` (exponentiation). The `+` operator is also ",
        "sourcePath": "developer-roadmap/roadmaps/javascript/content/arithmetic-operators@0PK1NwlgkNe2Vf-We4uLH.md"
      },
      {
        "id": "arrays@NZedBxG9B9TRVOf2QE2yL",
        "title": "Arrays",
        "slug": "arrays",
        "summary": "Arrays are ordered, indexed collections that can hold values of any type. JavaScript arrays are dynamic, meaning they can grow and shrink, and provide a rich set of built-in methods like `map()`, `filter()`, `reduce()`, ",
        "sourcePath": "developer-roadmap/roadmaps/javascript/content/arrays@NZedBxG9B9TRVOf2QE2yL.md"
      },
      {
        "id": "arrow-functions@fr0NChxMXLpJizyMhXcXS",
        "title": "Arrow Functions",
        "slug": "arrow-functions",
        "summary": "Arrow functions are a concise syntax for writing function expressions introduced in ES6. They use `=>` instead of the `function` keyword and do not have their own `this`, `arguments`, or `super` bindings. They are common",
        "sourcePath": "developer-roadmap/roadmaps/javascript/content/arrow-functions@fr0NChxMXLpJizyMhXcXS.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/javascript"
  },
  {
    "slug": "typescript",
    "title": "Typescript",
    "category": "skill",
    "description": "A focused learning path for mastering Typescript, with concepts, tools, projects, and next steps.",
    "topicCount": 93,
    "topics": [
      {
        "id": "abstract-classes@tZFWeWHdOUJcCEtHfXH9p",
        "title": "Abstract Classes",
        "slug": "abstract-classes",
        "summary": "An abstract class is a class that cannot be instantiated directly. Its primary purpose is to define a blueprint for other classes. It can contain abstract methods (methods without implementation) and concrete methods (me",
        "sourcePath": "developer-roadmap/roadmaps/typescript/content/abstract-classes@tZFWeWHdOUJcCEtHfXH9p.md"
      },
      {
        "id": "access-modifiers@RJ7on8WoxrKcXrR3qY5Rs",
        "title": "Access Modifiers",
        "slug": "access-modifiers",
        "summary": "Access modifiers in object-oriented programming control the visibility of class members (properties and methods). They determine which parts of your code, or even external code, can access and modify those members. Commo",
        "sourcePath": "developer-roadmap/roadmaps/typescript/content/access-modifiers@RJ7on8WoxrKcXrR3qY5Rs.md"
      },
      {
        "id": "advanced-types@2F7vOL__v9dLBohA263aj",
        "title": "Advanced Types",
        "slug": "advanced-types",
        "summary": "TypeScript's advanced types allow for more precise and flexible type definitions beyond basic primitives. Intersection types combine multiple types into one, requiring a value to satisfy all combined types. Union types a",
        "sourcePath": "developer-roadmap/roadmaps/typescript/content/advanced-types@2F7vOL__v9dLBohA263aj.md"
      },
      {
        "id": "ambient-modules@k_5y77k8ZZ9_O2WpWXWTY",
        "title": "Ambient Modules",
        "slug": "ambient-modules",
        "summary": "Ambient modules in TypeScript are used to describe the shape of existing JavaScript code when you don't have the TypeScript declaration files (`.d.ts`) readily available. They essentially allow you to tell the TypeScript",
        "sourcePath": "developer-roadmap/roadmaps/typescript/content/ambient-modules@k_5y77k8ZZ9_O2WpWXWTY.md"
      },
      {
        "id": "any@yXiLegSlL7SveU8rBGj8U",
        "title": "Any",
        "slug": "any",
        "summary": "TypeScript has a special type, `any`, that you can use whenever you don’t want a particular value to cause typechecking errors.",
        "sourcePath": "developer-roadmap/roadmaps/typescript/content/any@yXiLegSlL7SveU8rBGj8U.md"
      },
      {
        "id": "array@YbDuIo1BbZKEAZwmXlCdZ",
        "title": "Array",
        "slug": "array",
        "summary": "An array is a data structure that stores an ordered collection of elements, where each element is accessed using its numerical index. Arrays are fundamental for managing lists of items, and in TypeScript, you define the ",
        "sourcePath": "developer-roadmap/roadmaps/typescript/content/array@YbDuIo1BbZKEAZwmXlCdZ.md"
      },
      {
        "id": "as-any@afTNr36VqeXoJpHxm2IoS",
        "title": "As Any",
        "slug": "as-any",
        "summary": "`any` is a special type in TypeScript that represents a value of any type. When a value is declared with the any type, the compiler will not perform any type checks or type inference on that value.",
        "sourcePath": "developer-roadmap/roadmaps/typescript/content/as-any@afTNr36VqeXoJpHxm2IoS.md"
      },
      {
        "id": "as-const@pGFnTqi0-RSj0YRmNA5iy",
        "title": "as const",
        "slug": "as-const",
        "summary": "`as const` is a TypeScript feature that allows you to tell the compiler to infer the narrowest or most specific type possible for an expression. Instead of the compiler widening the type of a value to its general type (l",
        "sourcePath": "developer-roadmap/roadmaps/typescript/content/as-const@pGFnTqi0-RSj0YRmNA5iy.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/typescript"
  },
  {
    "slug": "react",
    "title": "React",
    "category": "skill",
    "description": "A focused learning path for mastering React, with concepts, tools, projects, and next steps.",
    "topicCount": 81,
    "topics": [
      {
        "id": "animation@bRpeoo9zXrnZ2IHSI7JX4",
        "title": "Animation",
        "slug": "animation",
        "summary": "Animation in React can be achieved using various methods, such as CSS transitions, keyframes, or libraries like `react-spring`, `framer-motion`, and `GSAP` (GreenSock Animation Platform). CSS transitions are ideal for si",
        "sourcePath": "developer-roadmap/roadmaps/react/content/animation@bRpeoo9zXrnZ2IHSI7JX4.md"
      },
      {
        "id": "api-calls@b4AP2OggxFAwsQtUwiUJJ",
        "title": "API Calls",
        "slug": "api-calls",
        "summary": "APIs, short for Application Programming Interfaces, are software-to-software interfaces. Meaning, they allow different applications to talk to each other and exchange information or functionality. This allows businesses ",
        "sourcePath": "developer-roadmap/roadmaps/react/content/api-calls@b4AP2OggxFAwsQtUwiUJJ.md"
      },
      {
        "id": "apollo@8nMbfGxe3STMbrAVcqHHh",
        "title": "Apollo",
        "slug": "apollo",
        "summary": "Apollo is a platform for building a unified graph, a communication layer that helps you manage the flow of data between your application clients (such as web and native apps) and your back-end services.",
        "sourcePath": "developer-roadmap/roadmaps/react/content/apollo@8nMbfGxe3STMbrAVcqHHh.md"
      },
      {
        "id": "ark-ui@kiCTo0U6VgNON8rv_Ktlj",
        "title": "Ark UI",
        "slug": "ark-ui",
        "summary": "It is a modern and versatile user interface framework designed to streamline the development of responsive and accessible web applications. It provides a `comprehensive set` of components and tools that simplify the proc",
        "sourcePath": "developer-roadmap/roadmaps/react/content/ark-ui@kiCTo0U6VgNON8rv_Ktlj.md"
      },
      {
        "id": "astro@_HoZkE7FH-v3wI_722ZTF",
        "title": "Astro",
        "slug": "astro",
        "summary": "Astro is the web framework for building content-driven websites like blogs, marketing, and e-commerce. Astro is best-known for pioneering a new frontend architecture to reduce JavaScript overhead and complexity compared ",
        "sourcePath": "developer-roadmap/roadmaps/react/content/astro@_HoZkE7FH-v3wI_722ZTF.md"
      },
      {
        "id": "axios@ElqWQClryfSYdL7P_mgYK",
        "title": "Axios",
        "slug": "axios",
        "summary": "The most common way for frontend programs to communicate with servers is through the HTTP protocol. You are probably familiar with the Fetch API and the XMLHttpRequest interface, which allows you to fetch resources and m",
        "sourcePath": "developer-roadmap/roadmaps/react/content/axios@ElqWQClryfSYdL7P_mgYK.md"
      },
      {
        "id": "chakra-ui@uqphqAnlcJOLnwHZs5jWu",
        "title": "Chakra UI",
        "slug": "chakra-ui",
        "summary": "Chakra UI is a simple, modular and accessible component library that gives you the building blocks you need to build your React applications.",
        "sourcePath": "developer-roadmap/roadmaps/react/content/chakra-ui@uqphqAnlcJOLnwHZs5jWu.md"
      },
      {
        "id": "cli-tools@tU4Umtnfu01t9gLlnlK6b",
        "title": "CLI Tools",
        "slug": "cli-tools",
        "summary": "Explore the core ideas behind CLI Tools.",
        "sourcePath": "developer-roadmap/roadmaps/react/content/cli-tools@tU4Umtnfu01t9gLlnlK6b.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/react"
  },
  {
    "slug": "nodejs",
    "title": "Nodejs",
    "category": "skill",
    "description": "A focused learning path for mastering Nodejs, with concepts, tools, projects, and next steps.",
    "topicCount": 113,
    "topics": [
      {
        "id": "--watch@812bVEzxwTsYzLG_PmLqN",
        "title": "--watch",
        "slug": "--watch",
        "summary": "The `--watch` flag in Node.js is a powerful feature introduced in Node.js version 19 that enables automatic reloading of your Node.js application whenever changes are detected in the specified files.",
        "sourcePath": "developer-roadmap/roadmaps/nodejs/content/--watch@812bVEzxwTsYzLG_PmLqN.md"
      },
      {
        "id": "__dirname@1AaGG660rvZlNYMOA35qO",
        "title": "__dirname",
        "slug": "__dirname",
        "summary": "The `__dirname` in a node script returns the path of the folder where the current JavaScript file resides. `__filename` and `__dirname` are used to get the filename and directory name of the currently executing file.",
        "sourcePath": "developer-roadmap/roadmaps/nodejs/content/__dirname@1AaGG660rvZlNYMOA35qO.md"
      },
      {
        "id": "__filename@P2gdwx1qCxvg1Ppfw0aqQ",
        "title": "__filename",
        "slug": "__filename",
        "summary": "The `__filename` in Node.js returns the filename of the executed code. It gives the absolute path of the code file. The following approach covers implementing `__filename` in the Node.js project.",
        "sourcePath": "developer-roadmap/roadmaps/nodejs/content/__filename@P2gdwx1qCxvg1Ppfw0aqQ.md"
      },
      {
        "id": "assertion-errors@do-tdCUfDtiZHBg4ZO3dC",
        "title": "Assertion Errors",
        "slug": "assertion-errors",
        "summary": "An `AssertionError` in Node.js is an error that is thrown when the `assert` module determines that a given expression is not truthy. The `assert` module is a built-in Node.js module that provides a simple set of assertio",
        "sourcePath": "developer-roadmap/roadmaps/nodejs/content/assertion-errors@do-tdCUfDtiZHBg4ZO3dC.md"
      },
      {
        "id": "async-programming@uE7fvHSTSdebMf5RsNyaY",
        "title": "Async Programming",
        "slug": "async-programming",
        "summary": "Asynchronous code means that things can happen independently of the main program flow, async functions in JavaScript are processed in the background without blocking other requests. It ensures non-blocking code execution",
        "sourcePath": "developer-roadmap/roadmaps/nodejs/content/async-programming@uE7fvHSTSdebMf5RsNyaY.md"
      },
      {
        "id": "asyncawait@a26qNCyMcT5GsVzxeNCLk",
        "title": "Async/Await",
        "slug": "asyncawait",
        "summary": "Async/Await is a special syntax to work with promises in a more comfortable fashion. It's easy to understand and use. Adding the keyword async before a function ensures that the function returns a promise and the keyword",
        "sourcePath": "developer-roadmap/roadmaps/nodejs/content/asyncawait@a26qNCyMcT5GsVzxeNCLk.md"
      },
      {
        "id": "axios@BOLiZg8YDKADMwP01U5ph",
        "title": "Axios",
        "slug": "axios",
        "summary": "Axios is a promise-based HTTP Client for node.js and the browser. Used for making requests to web servers. On the server-side it uses the native node.js http module, while on the client (browser) it uses XMLHttpRequests.",
        "sourcePath": "developer-roadmap/roadmaps/nodejs/content/axios@BOLiZg8YDKADMwP01U5ph.md"
      },
      {
        "id": "building--consuming-apis@fFVCb6aZWRHdNDFt5C09R",
        "title": "Building  Consuming Apis",
        "slug": "building--consuming-apis",
        "summary": "Building & Consuming APIs",
        "sourcePath": "developer-roadmap/roadmaps/nodejs/content/building--consuming-apis@fFVCb6aZWRHdNDFt5C09R.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/nodejs"
  },
  {
    "slug": "system-design",
    "title": "System Design",
    "category": "skill",
    "description": "A focused learning path for mastering System Design, with concepts, tools, projects, and next steps.",
    "topicCount": 147,
    "topics": [
      {
        "id": "ambassador@Hja4YF3JcgM6CPwB1mxmo",
        "title": "Ambassador",
        "slug": "ambassador",
        "summary": "Create helper services that send network requests on behalf of a consumer service or application. An ambassador service can be thought of as an out-of-process proxy that is co-located with the client.",
        "sourcePath": "developer-roadmap/roadmaps/system-design/content/ambassador@Hja4YF3JcgM6CPwB1mxmo.md"
      },
      {
        "id": "anti-corruption-layer@4hi7LvjLcv8eR6m-uk8XQ",
        "title": "Anti-corruption Layer",
        "slug": "anti-corruption-layer",
        "summary": "Implement a facade or adapter layer between different subsystems that don't share the same semantics. This layer translates requests that one subsystem makes to the other subsystem. Use this pattern to ensure that an app",
        "sourcePath": "developer-roadmap/roadmaps/system-design/content/anti-corruption-layer@4hi7LvjLcv8eR6m-uk8XQ.md"
      },
      {
        "id": "application-caching@5Ux_JBDOkflCaIm4tVBgO",
        "title": "Application Caching",
        "slug": "application-caching",
        "summary": "In-memory caches such as Memcached and Redis are key-value stores between your application and your data storage. Since the data is held in RAM, it is much faster than typical databases where data is stored on disk. RAM ",
        "sourcePath": "developer-roadmap/roadmaps/system-design/content/application-caching@5Ux_JBDOkflCaIm4tVBgO.md"
      },
      {
        "id": "application-layer@XXuzTrP5UNVwSpAk-tAGr",
        "title": "Application Layer",
        "slug": "application-layer",
        "summary": "Separating out the web layer from the application layer (also known as platform layer) allows you to scale and configure both layers independently. Adding a new API results in adding application servers without necessari",
        "sourcePath": "developer-roadmap/roadmaps/system-design/content/application-layer@XXuzTrP5UNVwSpAk-tAGr.md"
      },
      {
        "id": "async-request-reply@eNFNXPsFiryVxFe4unVxk",
        "title": "Asynchronous Request-Reply",
        "slug": "async-request-reply",
        "summary": "Decouple backend processing from a frontend host, where backend processing needs to be asynchronous, but the frontend still needs a clear response.",
        "sourcePath": "developer-roadmap/roadmaps/system-design/content/async-request-reply@eNFNXPsFiryVxFe4unVxk.md"
      },
      {
        "id": "asynchronism@84N4XY31PwXRntXX1sdCU",
        "title": "Asynchronism",
        "slug": "asynchronism",
        "summary": "Asynchronous workflows help reduce request times for expensive operations that would otherwise be performed in-line. They can also help by doing time-consuming work in advance, such as periodic aggregation of data.",
        "sourcePath": "developer-roadmap/roadmaps/system-design/content/asynchronism@84N4XY31PwXRntXX1sdCU.md"
      },
      {
        "id": "availability-in-numbers@uHdrZllrZFAnVkwIB3y5-",
        "title": "Availability in Numbers",
        "slug": "availability-in-numbers",
        "summary": "Availability is often quantified by uptime (or downtime) as a percentage of time the service is available. Availability is generally measured in number of 9s--a service with 99.99% availability is described as having fou",
        "sourcePath": "developer-roadmap/roadmaps/system-design/content/availability-in-numbers@uHdrZllrZFAnVkwIB3y5-.md"
      },
      {
        "id": "availability-monitoring@rVrwaioGURvrqNBufF2dj",
        "title": "Availability Monitoring",
        "slug": "availability-monitoring",
        "summary": "A truly healthy system requires that the components and subsystems that compose the system are available. Availability monitoring is closely related to health monitoring. But whereas health monitoring provides an immedia",
        "sourcePath": "developer-roadmap/roadmaps/system-design/content/availability-monitoring@rVrwaioGURvrqNBufF2dj.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/system-design"
  },
  {
    "slug": "sql",
    "title": "Sql",
    "category": "skill",
    "description": "A focused learning path for mastering Sql, with concepts, tools, projects, and next steps.",
    "topicCount": 112,
    "topics": [
      {
        "id": "abs@6vYFb_D1N_-tLWZftL-Az",
        "title": "ABS",
        "slug": "abs",
        "summary": "The `ABS()` function in SQL returns the absolute value of a given numeric expression, meaning it converts any negative number to its positive equivalent while leaving positive numbers unchanged. This function is useful w",
        "sourcePath": "developer-roadmap/roadmaps/sql/content/abs@6vYFb_D1N_-tLWZftL-Az.md"
      },
      {
        "id": "acid@igg34gLPl3HYVAmRNFGcV",
        "title": "ACID",
        "slug": "acid",
        "summary": "ACID are the four properties of relational database systems that help in making sure that we are able to perform the transactions in a reliable manner. It's an acronym which refers to the presence of four properties: ato",
        "sourcePath": "developer-roadmap/roadmaps/sql/content/acid@igg34gLPl3HYVAmRNFGcV.md"
      },
      {
        "id": "advanced-functions@vTMd0bqz4eTgLnhfgY61h",
        "title": "Advanced Functions",
        "slug": "advanced-functions",
        "summary": "Advanced functions in SQL go beyond the basic operations like selecting and filtering data. These functions allow you to perform complex calculations, manipulate strings, work with dates, and analyze data in more sophist",
        "sourcePath": "developer-roadmap/roadmaps/sql/content/advanced-functions@vTMd0bqz4eTgLnhfgY61h.md"
      },
      {
        "id": "advanced-sql@UDqbT1y-YzBrljfKSz_RG",
        "title": "Advanced SQL Concepts",
        "slug": "advanced-sql",
        "summary": "Advanced SQL concepts encompass a wide range of sophisticated techniques and features that go beyond basic querying and data manipulation. These include complex joins, subqueries, window functions, stored procedures, tri",
        "sourcePath": "developer-roadmap/roadmaps/sql/content/advanced-sql@UDqbT1y-YzBrljfKSz_RG.md"
      },
      {
        "id": "aggregate-queries@LX9nzJ4uqznHN4SksoDvr",
        "title": "Aggregate Queries",
        "slug": "aggregate-queries",
        "summary": "Aggregate queries in SQL are used to calculate summary values from multiple rows of a table, reducing the data to a single row based on a specific calculation. These calculations provide insights like totals, averages, a",
        "sourcePath": "developer-roadmap/roadmaps/sql/content/aggregate-queries@LX9nzJ4uqznHN4SksoDvr.md"
      },
      {
        "id": "alter-table@WjXlO42WL9saDS7RIGapt",
        "title": "Alter Table",
        "slug": "alter-table",
        "summary": "The `ALTER TABLE` statement in SQL is used to modify the structure of an existing table. This includes adding, dropping, or modifying columns, changing the data type of a column, setting default values, and adding or dro",
        "sourcePath": "developer-roadmap/roadmaps/sql/content/alter-table@WjXlO42WL9saDS7RIGapt.md"
      },
      {
        "id": "avg@Wou6YXLYUgomvcELh851L",
        "title": "AVG",
        "slug": "avg",
        "summary": "The `AVG()` function in SQL is an aggregate function that calculates the average value of a numeric column. It returns the sum of all the values in the column, divided by the count of those values.",
        "sourcePath": "developer-roadmap/roadmaps/sql/content/avg@Wou6YXLYUgomvcELh851L.md"
      },
      {
        "id": "basic-sql-syntax@JDDG4KfhtIlw1rkNCzUli",
        "title": "Basic SQL Syntax",
        "slug": "basic-sql-syntax",
        "summary": "Basic SQL syntax consists of straightforward commands that allow users to interact with a relational database. The core commands include `SELECT` for querying data, `INSERT INTO` for adding new records, `UPDATE` for modi",
        "sourcePath": "developer-roadmap/roadmaps/sql/content/basic-sql-syntax@JDDG4KfhtIlw1rkNCzUli.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/sql"
  },
  {
    "slug": "computer-science",
    "title": "Computer Science",
    "category": "skill",
    "description": "A focused learning path for mastering Computer Science, with concepts, tools, projects, and next steps.",
    "topicCount": 188,
    "topics": [
      {
        "id": "2-3-4-trees@IaPd_zuLbiOCwoSHQLoIG",
        "title": "2-3-4 Search Trees",
        "slug": "2-3-4-trees",
        "summary": "In practice: For every 2-4 tree, there are corresponding red–black trees with data elements in the same order. The insertion and deletion operations on 2-4 trees are also equivalent to color-flipping and rotations in red",
        "sourcePath": "developer-roadmap/roadmaps/computer-science/content/2-3-4-trees@IaPd_zuLbiOCwoSHQLoIG.md"
      },
      {
        "id": "2-3-search-trees@3jiV9R82qxpqIGfpEq_wK",
        "title": "2-3 Search Trees",
        "slug": "2-3-search-trees",
        "summary": "In practice: 2-3 trees have faster inserts at the expense of slower searches (since height is more compared to AVL trees).",
        "sourcePath": "developer-roadmap/roadmaps/computer-science/content/2-3-search-trees@3jiV9R82qxpqIGfpEq_wK.md"
      },
      {
        "id": "a-algorithm@Yrk2PLUa-_FAPlhCkMl3e",
        "title": "A* Algorithm",
        "slug": "a-algorithm",
        "summary": "A\\* is a graph traversal algorithm that is used to find the shortest path between two nodes in a graph. It is a modified version of Dijkstra's algorithm that uses heuristics to find the shortest path. It is used in pathf",
        "sourcePath": "developer-roadmap/roadmaps/computer-science/content/a-algorithm@Yrk2PLUa-_FAPlhCkMl3e.md"
      },
      {
        "id": "acid-model@W5B-v-BFcCRmuN0L1m6PI",
        "title": "ACID",
        "slug": "acid-model",
        "summary": "ACID are the four properties of any database system that help in making sure that we are able to perform the transactions in a reliable manner. It's an acronym which refers to the presence of four properties: atomicity, ",
        "sourcePath": "developer-roadmap/roadmaps/computer-science/content/acid-model@W5B-v-BFcCRmuN0L1m6PI.md"
      },
      {
        "id": "activity-diagrams@ptfRNiU0mC0Q5SLA_FWZu",
        "title": "Activity Diagrams",
        "slug": "activity-diagrams",
        "summary": "Activity diagrams are used to model the flow of control in a system. They are used in conjunction with use case diagrams to model the behavior of the system for each use case. They are also used to model the behavior of ",
        "sourcePath": "developer-roadmap/roadmaps/computer-science/content/activity-diagrams@ptfRNiU0mC0Q5SLA_FWZu.md"
      },
      {
        "id": "adjacency-list@rTnKJcPniUtqvfOyC88N0",
        "title": "Graph Representation",
        "slug": "adjacency-list",
        "summary": "A graph can either be represented as an adjacency matrix or an adjacency list.",
        "sourcePath": "developer-roadmap/roadmaps/computer-science/content/adjacency-list@rTnKJcPniUtqvfOyC88N0.md"
      },
      {
        "id": "adjacency-matrix@HZ1kk0TQ13FLC9t13BZl5",
        "title": "Adjacency Matrix",
        "slug": "adjacency-matrix",
        "summary": "An adjacency matrix is a square matrix used to represent a finite graph. It is used to represent the connections between vertices in a graph. The matrix is filled with 0s and 1s, where a 1 represents a connection between",
        "sourcePath": "developer-roadmap/roadmaps/computer-science/content/adjacency-matrix@HZ1kk0TQ13FLC9t13BZl5.md"
      },
      {
        "id": "architectural-patterns@BGhJNtszbYJtKyhqr2jax",
        "title": "Architectural Patterns",
        "slug": "architectural-patterns",
        "summary": "Architectural patterns are a high-level design pattern that focuses on the overall structure of the system. They are similar to design patterns, but they are more concerned with the structure of the system. They are used",
        "sourcePath": "developer-roadmap/roadmaps/computer-science/content/architectural-patterns@BGhJNtszbYJtKyhqr2jax.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/computer-science"
  },
  {
    "slug": "machine-learning",
    "title": "Machine Learning",
    "category": "role",
    "description": "A practical path for becoming a stronger Machine Learning practitioner, from fundamentals to production-ready work.",
    "topicCount": 150,
    "topics": [
      {
        "id": "accuracy@3wib9UH0_OLhKjqKoZEMv",
        "title": "Accuracy",
        "slug": "accuracy",
        "summary": "Accuracy measures how often a machine learning model correctly predicts the outcome. It's calculated by dividing the number of correct predictions by the total number of predictions made. The formula for accuracy is: (Nu",
        "sourcePath": "developer-roadmap/roadmaps/machine-learning/content/accuracy@3wib9UH0_OLhKjqKoZEMv.md"
      },
      {
        "id": "activation-functions@RXTci1N6i6D9HqTbsLYIy",
        "title": "Activation Functions",
        "slug": "activation-functions",
        "summary": "Activation functions in neural networks determine the output of a node given an input or set of inputs. They introduce non-linearity into the network, allowing it to learn complex patterns and relationships in data. With",
        "sourcePath": "developer-roadmap/roadmaps/machine-learning/content/activation-functions@RXTci1N6i6D9HqTbsLYIy.md"
      },
      {
        "id": "actor-critic-methods@4Vy6lW9vF_SWwbKLU0qno",
        "title": "Actor-Critic Methods",
        "slug": "actor-critic-methods",
        "summary": "Actor-Critic methods in reinforcement learning are a type of algorithm that combines the strengths of both value-based and policy-based approaches. They use two separate models: an \"actor\" that learns the optimal policy ",
        "sourcePath": "developer-roadmap/roadmaps/machine-learning/content/actor-critic-methods@4Vy6lW9vF_SWwbKLU0qno.md"
      },
      {
        "id": "apis@s-wUPMaagyRupT2RdfHks",
        "title": "APIs",
        "slug": "apis",
        "summary": "Application Programming Interfaces, better known as APIs, play a fundamental role in the work of data analysts, particularly in the process of data collection. APIs are sets of protocols, routines, and tools that enable ",
        "sourcePath": "developer-roadmap/roadmaps/machine-learning/content/apis@s-wUPMaagyRupT2RdfHks.md"
      },
      {
        "id": "applications-of-cnns@gCGHtxqD4V_Ite_AXMspf",
        "title": "Convolutional Neural Networks (CNNs) Applications",
        "slug": "applications-of-cnns",
        "summary": "CNNs have revolutionized the field of computer vision, leading to significant advancements in many real-world applications. Thanks to their power to solve complex problems like image classification, object detection, and",
        "sourcePath": "developer-roadmap/roadmaps/machine-learning/content/applications-of-cnns@gCGHtxqD4V_Ite_AXMspf.md"
      },
      {
        "id": "attention-mechanisms@-tzeA13f2jYDm4aO5JciT",
        "title": "Attention Mechanisms",
        "slug": "attention-mechanisms",
        "summary": "Developed by Google researchers, the attention mechanisms allow a neural network to focus on the most relevant parts of the input data when making predictions. Instead of processing the entire input uniformly, attention ",
        "sourcePath": "developer-roadmap/roadmaps/machine-learning/content/attention-mechanisms@-tzeA13f2jYDm4aO5JciT.md"
      },
      {
        "id": "attention-models@sChxcuQ2OruKVx8P4wAK_",
        "title": "Attention Models",
        "slug": "attention-models",
        "summary": "Attention models in natural language processing allow a neural network to focus on specific parts of the input sequence when producing an output. Instead of relying on a fixed-length vector representation of the entire i",
        "sourcePath": "developer-roadmap/roadmaps/machine-learning/content/attention-models@sChxcuQ2OruKVx8P4wAK_.md"
      },
      {
        "id": "autoencoders@kvf2CUKBe4qSbZla4Brh3",
        "title": "Autoencoders",
        "slug": "autoencoders",
        "summary": "Autoencoders are a type of neural network used for unsupervised learning. They work by compressing the input data into a lower-dimensional representation (encoding) and then reconstructing the original input from this co",
        "sourcePath": "developer-roadmap/roadmaps/machine-learning/content/autoencoders@kvf2CUKBe4qSbZla4Brh3.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/machine-learning"
  },
  {
    "slug": "cyber-security",
    "title": "Cyber Security",
    "category": "role",
    "description": "A practical path for becoming a stronger Cyber Security practitioner, from fundamentals to production-ready work.",
    "topicCount": 301,
    "topics": [
      {
        "id": "acl@35oCRzhzpVfitQPL4K9KC",
        "title": "Access Control Lists (ACLs)",
        "slug": "acl",
        "summary": "An Access Control List (ACL) is a set of permissions attached to an object (like a file, folder, or network resource) that specifies which users or groups have access to the object and what level of access they are grant",
        "sourcePath": "developer-roadmap/roadmaps/cyber-security/content/acl@35oCRzhzpVfitQPL4K9KC.md"
      },
      {
        "id": "acls@8JM95sonFUhZCdaynUA_M",
        "title": "ACLs",
        "slug": "acls",
        "summary": "An Access Control List (ACL) is a security mechanism used to define which users or system processes are granted access to objects, such as files, directories, or network resources, and what operations they can perform on",
        "sourcePath": "developer-roadmap/roadmaps/cyber-security/content/acls@8JM95sonFUhZCdaynUA_M.md"
      },
      {
        "id": "antimalware@9QtY1hMJ7NKLFztYK-mHY",
        "title": "Antimalware",
        "slug": "antimalware",
        "summary": "Antimalware refers to software designed to detect, prevent, and remove malicious software (malware) from computer systems. This type of software typically includes features like real-time scanning, scheduled scans, and r",
        "sourcePath": "developer-roadmap/roadmaps/cyber-security/content/antimalware@9QtY1hMJ7NKLFztYK-mHY.md"
      },
      {
        "id": "antivirus@3140n5prZYySsuBHjqGOJ",
        "title": "Antivirus",
        "slug": "antivirus",
        "summary": "Antivirus software is a program designed to detect, prevent, and remove malicious software (malware) from a computer system. It works by scanning files, directories, or systems for known viruses, worms, trojans, spyware,",
        "sourcePath": "developer-roadmap/roadmaps/cyber-security/content/antivirus@3140n5prZYySsuBHjqGOJ.md"
      },
      {
        "id": "anyrun@GZHFR43UzN0WIIxGKZOdX",
        "title": "any.run",
        "slug": "anyrun",
        "summary": "any.run is an interactive online platform used for analyzing suspicious files and URLs in a safe, isolated environment. It allows users to execute potentially malicious software or visit questionable websites without ris",
        "sourcePath": "developer-roadmap/roadmaps/cyber-security/content/anyrun@GZHFR43UzN0WIIxGKZOdX.md"
      },
      {
        "id": "apt@l0BvDtwWoRSEjm6O0WDPy",
        "title": "APT",
        "slug": "apt",
        "summary": "Advanced Persistent Threats, or APTs, are a class of cyber threats characterized by their persistence over a long period, extensive resources, and a high level of sophistication. Often associated with nation-state actors",
        "sourcePath": "developer-roadmap/roadmaps/cyber-security/content/apt@l0BvDtwWoRSEjm6O0WDPy.md"
      },
      {
        "id": "arp@M52V7hmG4ORf4TIVw3W3J",
        "title": "ARP",
        "slug": "arp",
        "summary": "Address Resolution Protocol (ARP) is a communication protocol used for discovering the link-layer address, such as a MAC address, associated with a given Internet layer address, typically an IPv4 address. In simpler term",
        "sourcePath": "developer-roadmap/roadmaps/cyber-security/content/arp@M52V7hmG4ORf4TIVw3W3J.md"
      },
      {
        "id": "arp@fzdZF-nzIL69kaA7kwOCn",
        "title": "ARP",
        "slug": "arp",
        "summary": "ARP, or Address Resolution Protocol, is a communication protocol used for discovering the link layer address (typically a MAC address) associated with a given internet layer address (typically an IPv4 address). It operat",
        "sourcePath": "developer-roadmap/roadmaps/cyber-security/content/arp@fzdZF-nzIL69kaA7kwOCn.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/cyber-security"
  },
  {
    "slug": "cloudflare",
    "title": "Cloudflare",
    "category": "skill",
    "description": "A focused learning path for mastering Cloudflare, with concepts, tools, projects, and next steps.",
    "topicCount": 97,
    "topics": [
      {
        "id": "ai-gateway@vu8yJsS1WccsdcEVUqwNd",
        "title": "AI Gateway",
        "slug": "ai-gateway",
        "summary": "Cloudflare's AI Gateway acts as a central point for managing and optimizing your AI workloads. It provides features like caching, rate limiting, and observability for AI requests, helping you improve performance, reduce ",
        "sourcePath": "developer-roadmap/roadmaps/cloudflare/content/ai-gateway@vu8yJsS1WccsdcEVUqwNd.md"
      },
      {
        "id": "ai-model-integration@QxPoNHsL-Pj_z3aU6qEP4",
        "title": "AI Model Integration",
        "slug": "ai-model-integration",
        "summary": "Workers AI provides the ability to run AI models directly on Cloudflare's edge network for recognition tasks. This includes image recognition (identifying objects or scenes in images) and natural language understanding (",
        "sourcePath": "developer-roadmap/roadmaps/cloudflare/content/ai-model-integration@QxPoNHsL-Pj_z3aU6qEP4.md"
      },
      {
        "id": "ai-powered-search@Ep9_oV_YnkbH1gHM-n3gO",
        "title": "AI-powered Search",
        "slug": "ai-powered-search",
        "summary": "You can build AI-powered search using Cloudflare Workers, Workers AI, and Vectorize.",
        "sourcePath": "developer-roadmap/roadmaps/cloudflare/content/ai-powered-search@Ep9_oV_YnkbH1gHM-n3gO.md"
      },
      {
        "id": "any-frontend-framework@zSwio18XdBfqwSneAx_AP",
        "title": "Any Frontend Framework",
        "slug": "any-frontend-framework",
        "summary": "Several frontend frameworks can be deployed on Cloudflare Pages or used with Cloudflare Workers. Popular choices include:",
        "sourcePath": "developer-roadmap/roadmaps/cloudflare/content/any-frontend-framework@zSwio18XdBfqwSneAx_AP.md"
      },
      {
        "id": "asset-management@3jU5753Uza2aS-gZo7w4k",
        "title": "Asset Management",
        "slug": "asset-management",
        "summary": "Cloudflare R2 can be used for efficient asset management. You can store images, videos, and other static assets in R2 and serve them directly through Cloudflare's CDN. This reduces the load on your origin server and impr",
        "sourcePath": "developer-roadmap/roadmaps/cloudflare/content/asset-management@3jU5753Uza2aS-gZo7w4k.md"
      },
      {
        "id": "background-jobs@qgvDGyLjc6lMmVPjHozFM",
        "title": "Background Jobs",
        "slug": "background-jobs",
        "summary": "Cloudflare Queues are ideal for handling background jobs. Instead of performing time-consuming tasks directly within a request/response cycle, you can enqueue a message describing the task. A separate Worker, acting as a",
        "sourcePath": "developer-roadmap/roadmaps/cloudflare/content/background-jobs@qgvDGyLjc6lMmVPjHozFM.md"
      },
      {
        "id": "basic-command-line-knowledge@q9oQTt_NqhdWvJfA5XH1V",
        "title": "Basic Command-line Knowledge",
        "slug": "basic-command-line-knowledge",
        "summary": "Knowing basic command-line commands is a must-have, not when working with Cloudflare but also as a developer. Learn the basics of navigating directories, file management, text editing, package management etc.",
        "sourcePath": "developer-roadmap/roadmaps/cloudflare/content/basic-command-line-knowledge@q9oQTt_NqhdWvJfA5XH1V.md"
      },
      {
        "id": "bindings@9ef2VPCru8lCmRxxGe-Eo",
        "title": "Bindings",
        "slug": "bindings",
        "summary": "In Cloudflare Workers, Bindings are configurations that connect your Worker to external resources or services. These can include:",
        "sourcePath": "developer-roadmap/roadmaps/cloudflare/content/bindings@9ef2VPCru8lCmRxxGe-Eo.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/cloudflare"
  },
  {
    "slug": "kubernetes",
    "title": "Kubernetes",
    "category": "skill",
    "description": "A focused learning path for mastering Kubernetes, with concepts, tools, projects, and next steps.",
    "topicCount": 67,
    "topics": [
      {
        "id": "adding-and-managing-worker-nodes@2cQKTxln3dIk5IjX2UZdM",
        "title": "Managing Worker Nodes",
        "slug": "adding-and-managing-worker-nodes",
        "summary": "Kubernetes runs your workload by placing containers into Pods to run on Nodes. A node may be a virtual or physical machine, depending on the cluster. Each node is managed by the control plane and contains the services ne",
        "sourcePath": "developer-roadmap/roadmaps/kubernetes/content/adding-and-managing-worker-nodes@2cQKTxln3dIk5IjX2UZdM.md"
      },
      {
        "id": "advanced-topics@t8SJbGVXsUDECxePLDk_w",
        "title": "Advanced Kubernetes Topics",
        "slug": "advanced-topics",
        "summary": "Advanced Kubernetes concepts cover production-grade techniques for DevOps, Docker, and backend development. These include GitOps deployments, container optimization, stateful workloads management, secure cloud-native app",
        "sourcePath": "developer-roadmap/roadmaps/kubernetes/content/advanced-topics@t8SJbGVXsUDECxePLDk_w.md"
      },
      {
        "id": "assigning-quotas-to-namespaces@OHz4QMmA3lqL_C7aWL8Ga",
        "title": "Assigning Quotas to Namespaces",
        "slug": "assigning-quotas-to-namespaces",
        "summary": "Assigning quotas to namespaces is a way to limit resource usage for specific groups of resources in Kubernetes. Quotas can be set for CPU, memory, and other resources, as well as for the number of objects in a namespace.",
        "sourcePath": "developer-roadmap/roadmaps/kubernetes/content/assigning-quotas-to-namespaces@OHz4QMmA3lqL_C7aWL8Ga.md"
      },
      {
        "id": "autoscaling@03mGA5AyL7mpF6y3EMW7A",
        "title": "Autoscaling",
        "slug": "autoscaling",
        "summary": "Autoscaling in Kubernetes involves adjusting the resources allocated to a deployment or set of pods based on demand. It includes Horizontal Pod Autoscaling (HPA) and Vertical Pod Autoscaling (VPA), which increase or decr",
        "sourcePath": "developer-roadmap/roadmaps/kubernetes/content/autoscaling@03mGA5AyL7mpF6y3EMW7A.md"
      },
      {
        "id": "basics@70lTSIVh0AD6M8fMMuWzY",
        "title": "Scheduling Basics",
        "slug": "basics",
        "summary": "Scheduling involves assigning pods to worker nodes based on criteria such as resource availability, labels, affinity/anti-affinity rules, taints, and tolerations. Pods are the smallest deployable units in k8s, consisting",
        "sourcePath": "developer-roadmap/roadmaps/kubernetes/content/basics@70lTSIVh0AD6M8fMMuWzY.md"
      },
      {
        "id": "blue-green-deployments@9-oaTlzKmcxTfaRycz1w3",
        "title": "Blue Green Deployments",
        "slug": "blue-green-deployments",
        "summary": "It is a deployment strategy used in Kubernetes for deploying new versions of an application by running two identical production environments, one with the current version (blue) and the other with the new version (green)",
        "sourcePath": "developer-roadmap/roadmaps/kubernetes/content/blue-green-deployments@9-oaTlzKmcxTfaRycz1w3.md"
      },
      {
        "id": "canary-deployments@88IGeC3dAopHLGtLozxdY",
        "title": "Canary Deployments",
        "slug": "canary-deployments",
        "summary": "Canary Deployments is a technique used in Kubernetes to gradually roll out new versions of an application by directing a small percentage of users or traffic to the new version while the majority continue using the old v",
        "sourcePath": "developer-roadmap/roadmaps/kubernetes/content/canary-deployments@88IGeC3dAopHLGtLozxdY.md"
      },
      {
        "id": "choosing-a-managed-provider@qSatCdBTDXPu-IFWzUI99",
        "title": "Choosing a Managed Provider",
        "slug": "choosing-a-managed-provider",
        "summary": "A managed provider is a cloud-based service that provides a managed Kubernetes environment. This means that the provider handles the underlying infrastructure, such as servers, storage, and networking, as well as the ins",
        "sourcePath": "developer-roadmap/roadmaps/kubernetes/content/choosing-a-managed-provider@qSatCdBTDXPu-IFWzUI99.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/kubernetes"
  },
  {
    "slug": "docker",
    "title": "Docker",
    "category": "skill",
    "description": "A focused learning path for mastering Docker, with concepts, tools, projects, and next steps.",
    "topicCount": 56,
    "topics": [
      {
        "id": "application-architecture@EqYWfBL5l5OOquok_OvOW",
        "title": "Application Architecture",
        "slug": "application-architecture",
        "summary": "Application architecture in containerized environments focuses on designing applications to leverage containerization benefits. This includes microservices patterns, service decomposition, inter-service communication, da",
        "sourcePath": "developer-roadmap/roadmaps/docker/content/application-architecture@EqYWfBL5l5OOquok_OvOW.md"
      },
      {
        "id": "bare-metal-vs-vms-vs-containers@3hatcMVLDbMuz73uTx-9P",
        "title": "Bare Metal vs VM vs Containers",
        "slug": "bare-metal-vs-vms-vs-containers",
        "summary": "Bare metal runs applications directly on hardware with maximum performance but limited flexibility. VMs use hypervisors to run multiple OS instances with strong isolation but higher overhead. Containers share the host OS",
        "sourcePath": "developer-roadmap/roadmaps/docker/content/bare-metal-vs-vms-vs-containers@3hatcMVLDbMuz73uTx-9P.md"
      },
      {
        "id": "basics-of-docker@kIqx7Inf50mE9W0juwNBz",
        "title": "Docker Basics",
        "slug": "basics-of-docker",
        "summary": "Docker is a platform that simplifies building, packaging, and deploying applications in lightweight, portable containers. Key components include Dockerfiles (build instructions), Images (snapshots), and Containers (runni",
        "sourcePath": "developer-roadmap/roadmaps/docker/content/basics-of-docker@kIqx7Inf50mE9W0juwNBz.md"
      },
      {
        "id": "bind-mounts@wZcCW1ojGzUakHCv2AaI1",
        "title": "Bind Mounts",
        "slug": "bind-mounts",
        "summary": "Bind mounts have limited functionality compared to volumes. When you use a bind mount, a file or directory on the host machine is mounted into a container. The file or directory is referenced by its absolute path on the ",
        "sourcePath": "developer-roadmap/roadmaps/docker/content/bind-mounts@wZcCW1ojGzUakHCv2AaI1.md"
      },
      {
        "id": "building-container-images@5OEfBQaYNOCi999x6QUqW",
        "title": "Building Container Images",
        "slug": "building-container-images",
        "summary": "Container images are executable packages that include everything required to run an application: code, runtime, system tools, libraries, and settings. By building custom images, you can deploy applications seamlessly wit",
        "sourcePath": "developer-roadmap/roadmaps/docker/content/building-container-images@5OEfBQaYNOCi999x6QUqW.md"
      },
      {
        "id": "cgroups@fRl4EfNwlBiidzn3IV34-",
        "title": "cgroups",
        "slug": "cgroups",
        "summary": "cgroups (control groups) are Linux kernel features that limit and manage system resources like CPU, memory, and I/O for process groups. Docker uses cgroups to enforce resource constraints on containers, ensuring predicta",
        "sourcePath": "developer-roadmap/roadmaps/docker/content/cgroups@fRl4EfNwlBiidzn3IV34-.md"
      },
      {
        "id": "command-line-utilities@YzpB7rgSR4ueQRLa0bRWa",
        "title": "Command Line Utilities",
        "slug": "command-line-utilities",
        "summary": "Docker images can include command line utilities or standalone applications that we can run inside containers.",
        "sourcePath": "developer-roadmap/roadmaps/docker/content/command-line-utilities@YzpB7rgSR4ueQRLa0bRWa.md"
      },
      {
        "id": "container-registries@3VKPiMfbGBxv9m_SljIQV",
        "title": "Container Registries",
        "slug": "container-registries",
        "summary": "A Container Registry is a centralized storage and distribution system for Docker container images. It allows developers to easily share and deploy applications in the form of these images. Container registries play a cru",
        "sourcePath": "developer-roadmap/roadmaps/docker/content/container-registries@3VKPiMfbGBxv9m_SljIQV.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/docker"
  },
  {
    "slug": "ai-agents",
    "title": "AI Agents",
    "category": "skill",
    "description": "A focused learning path for mastering AI Agents, with concepts, tools, projects, and next steps.",
    "topicCount": 101,
    "topics": [
      {
        "id": "acting--tool-invocation@sHYd4KsKlmw5Im3nQ19W8",
        "title": "Acting / Tool Invocation",
        "slug": "acting--tool-invocation",
        "summary": "Acting, also called tool invocation, is the step where the AI chooses a tool and runs it to get real-world data or to change something. The agent looks at its current goal and the plan it just made. It then picks the bes",
        "sourcePath": "developer-roadmap/roadmaps/ai-agents/content/acting--tool-invocation@sHYd4KsKlmw5Im3nQ19W8.md"
      },
      {
        "id": "agent-loop@Eih4eybuYB3C2So8K0AT3",
        "title": "Agent Loop",
        "slug": "agent-loop",
        "summary": "An agent loop is the cycle that lets an AI agent keep working toward a goal. First, the agent gathers fresh data from its tools, sensors, or memory. Next, it updates its internal state and decides what to do, often by ru",
        "sourcePath": "developer-roadmap/roadmaps/ai-agents/content/agent-loop@Eih4eybuYB3C2So8K0AT3.md"
      },
      {
        "id": "agno@PY5WTJgRnXiYeOM6BBUvn",
        "title": "Agno",
        "slug": "agno",
        "summary": "Agno is a Python framework designed to streamline the process of building AI agents. It offers tools and abstractions that simplify tasks such as agent planning, tool use, and memory management, making it easier to creat",
        "sourcePath": "developer-roadmap/roadmaps/ai-agents/content/agno@PY5WTJgRnXiYeOM6BBUvn.md"
      },
      {
        "id": "anthropic-tool-use@1EZFbDHA5J5_5BPMLMxXb",
        "title": "Anthropic Tool Use",
        "slug": "anthropic-tool-use",
        "summary": "Anthropic Tool Use lets you connect a Claude model to real software functions so the agent can do useful tasks on its own. You give Claude a list of tools, each with a name, a short description, and a strict JSON schema ",
        "sourcePath": "developer-roadmap/roadmaps/ai-agents/content/anthropic-tool-use@1EZFbDHA5J5_5BPMLMxXb.md"
      },
      {
        "id": "api-requests@52qxjZILV-X1isup6dazC",
        "title": "API Requests",
        "slug": "api-requests",
        "summary": "API requests let an AI agent ask another service for data or for an action. The agent builds a short message that follows the service’s rules, sends it over the internet, and waits for a reply. For example, it can call a",
        "sourcePath": "developer-roadmap/roadmaps/ai-agents/content/api-requests@52qxjZILV-X1isup6dazC.md"
      },
      {
        "id": "autogen@7YtnQ9-KIvGPSpDzEDexl",
        "title": "AutoGen",
        "slug": "autogen",
        "summary": "AutoGen is an open-source Python framework that helps you build AI agents without starting from scratch. It lets you define each agent with a role, goals, and tools, then handles the chat flow between them and a large la",
        "sourcePath": "developer-roadmap/roadmaps/ai-agents/content/autogen@7YtnQ9-KIvGPSpDzEDexl.md"
      },
      {
        "id": "basic-backend-development@VPI89s-m885r2YrXjYxdd",
        "title": "Basic Backend Development",
        "slug": "basic-backend-development",
        "summary": "Before you start learning how to build AI agents, we would recommend you to have a basic knowledge of Backend development. This includes, programming language knowledge, interacting with database and basics of APIs at mi",
        "sourcePath": "developer-roadmap/roadmaps/ai-agents/content/basic-backend-development@VPI89s-m885r2YrXjYxdd.md"
      },
      {
        "id": "be-specific-in-what-you-want@qFKFM2qNPEN7EoD0V-1SM",
        "title": "Be specific in what you want",
        "slug": "be-specific-in-what-you-want",
        "summary": "When you ask an AI to do something, clear and exact words help it give the answer you want. State the goal, the format, and any limits up front. Say who the answer is for, how long it should be, and what to leave out. If",
        "sourcePath": "developer-roadmap/roadmaps/ai-agents/content/be-specific-in-what-you-want@qFKFM2qNPEN7EoD0V-1SM.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/ai-agents"
  },
  {
    "slug": "ai-product-builder",
    "title": "AI Product Builders",
    "category": "skill",
    "description": "A focused learning path for mastering AI Product Builders, with concepts, tools, projects, and next steps.",
    "topicCount": 51,
    "topics": [
      {
        "id": "1-prototyping@ZGqeasMGuEiZvrdyjSNuM",
        "title": "Prototyping",
        "slug": "1-prototyping",
        "summary": "A prototype is a visual representation of your app before any code is generated. It helps you align with stakeholders, catch missing features early, and give the generation tool a concrete reference to work from. It does",
        "sourcePath": "developer-roadmap/roadmaps/ai-product-builder/content/1-prototyping@ZGqeasMGuEiZvrdyjSNuM.md"
      },
      {
        "id": "2-generation@DCcj2_9a7aYi6qCnI4TMV",
        "title": "2. Generation",
        "slug": "2-generation",
        "summary": "This is the step where your prototype and requirements are turned into a working codebase by an AI tool. The output should include a front end, a back end, a database schema, and an API layer. The quality of the output d",
        "sourcePath": "developer-roadmap/roadmaps/ai-product-builder/content/2-generation@DCcj2_9a7aYi6qCnI4TMV.md"
      },
      {
        "id": "3-refinement@S9fE9eG1YWSfVRi8h13U1",
        "title": "3. Refinement",
        "slug": "3-refinement",
        "summary": "Once you have a generated codebase, you will need to adjust it. Some changes are small and targeted; others require regenerating a larger part of the application. Knowing which type of change you are dealing with before ",
        "sourcePath": "developer-roadmap/roadmaps/ai-product-builder/content/3-refinement@S9fE9eG1YWSfVRi8h13U1.md"
      },
      {
        "id": "4-collaboration@rcR8DMzELUnmJ7I_pwWpI",
        "title": "Collaboration",
        "slug": "4-collaboration",
        "summary": "At this stage, you bring other people into the process: teammates, testers, or early users. Their feedback drives the next round of refinement. This node also covers the tools and practices that keep the codebase stable ",
        "sourcePath": "developer-roadmap/roadmaps/ai-product-builder/content/4-collaboration@rcR8DMzELUnmJ7I_pwWpI.md"
      },
      {
        "id": "5-deployment@t03SkyX28SacfP_DpmHUf",
        "title": "Deployment",
        "slug": "5-deployment",
        "summary": "Deployment is the process of making your app available to real users. The right deployment option depends on your technical experience, expected traffic, and budget. Start with the simplest option that meets your needs a",
        "sourcePath": "developer-roadmap/roadmaps/ai-product-builder/content/5-deployment@t03SkyX28SacfP_DpmHUf.md"
      },
      {
        "id": "ai-product-creation-cycle@COeXWV8fCTHXPZnErXcGZ",
        "title": "AI Product Creation Cycle",
        "slug": "ai-product-creation-cycle",
        "summary": "AI tools are changing how software is built. The traditional approach of writing code from scratch is being replaced by a new paradigm: you generate a working product from your requirements, test it with real users, and ",
        "sourcePath": "developer-roadmap/roadmaps/ai-product-builder/content/ai-product-creation-cycle@COeXWV8fCTHXPZnErXcGZ.md"
      },
      {
        "id": "app-anatomy@ncU03bZztHwt9VrQbEZ15",
        "title": "App Anatomy",
        "slug": "app-anatomy",
        "summary": "Every app has the same basic parts: a front end that users interact with, a back end that processes logic, a database that stores data, and an API that connects them. Understanding this structure helps you review what th",
        "sourcePath": "developer-roadmap/roadmaps/ai-product-builder/content/app-anatomy@ncU03bZztHwt9VrQbEZ15.md"
      },
      {
        "id": "aws@-MWVEd4dEfGcwBTxKh9WM",
        "title": "AWS",
        "slug": "aws",
        "summary": "AWS is the largest cloud provider in the world. It offers infrastructure for computing, storage, databases, networking, and dozens of other services. It requires more configuration than PaaS options but gives you complet",
        "sourcePath": "developer-roadmap/roadmaps/ai-product-builder/content/aws@-MWVEd4dEfGcwBTxKh9WM.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/ai-product-builder"
  },
  {
    "slug": "ai-red-teaming",
    "title": "AI Red Teaming",
    "category": "skill",
    "description": "A focused learning path for mastering AI Red Teaming, with concepts, tools, projects, and next steps.",
    "topicCount": 64,
    "topics": [
      {
        "id": "advanced-techniques@soC-kcem1ISbnCQMa6BIB",
        "title": "Advanced Techniques",
        "slug": "advanced-techniques",
        "summary": "The practice of AI Red Teaming itself will evolve. Future techniques may involve using AI adversaries to automatically discover complex vulnerabilities, developing more sophisticated methods for testing AI alignment and ",
        "sourcePath": "developer-roadmap/roadmaps/ai-red-teaming/content/advanced-techniques@soC-kcem1ISbnCQMa6BIB.md"
      },
      {
        "id": "adversarial-examples@xjlttOti-_laPRn8a2fVy",
        "title": "Adversarial Examples",
        "slug": "adversarial-examples",
        "summary": "A core AI Red Teaming activity involves generating adversarial examples – inputs slightly perturbed to cause misclassification or bypass safety filters – to test model robustness. Red teamers use various techniques (grad",
        "sourcePath": "developer-roadmap/roadmaps/ai-red-teaming/content/adversarial-examples@xjlttOti-_laPRn8a2fVy.md"
      },
      {
        "id": "adversarial-training@2Y0ZO-etpv3XIvunDLu-W",
        "title": "Adversarial Training",
        "slug": "adversarial-training",
        "summary": "AI Red Teamers evaluate the effectiveness of adversarial training as a defense. They test if models trained on adversarial examples are truly robust or if new, unseen adversarial attacks can still bypass the hardened def",
        "sourcePath": "developer-roadmap/roadmaps/ai-red-teaming/content/adversarial-training@2Y0ZO-etpv3XIvunDLu-W.md"
      },
      {
        "id": "agentic-ai-security@FVsKivsJrIb82B0lpPmgw",
        "title": "Agentic AI Security",
        "slug": "agentic-ai-security",
        "summary": "As AI agents capable of autonomous action become more common, AI Red Teamers must test their unique security implications. This involves assessing risks related to goal hijacking, unintended actions through tool use, exp",
        "sourcePath": "developer-roadmap/roadmaps/ai-red-teaming/content/agentic-ai-security@FVsKivsJrIb82B0lpPmgw.md"
      },
      {
        "id": "ai-security-fundamentals@R9DQNc0AyAQ2HLpP4HOk6",
        "title": "AI Security Fundamentals",
        "slug": "ai-security-fundamentals",
        "summary": "This covers the foundational concepts essential for AI Red Teaming, bridging traditional cybersecurity with AI-specific threats. An AI Red Teamer must understand common vulnerabilities in ML models (like evasion or poiso",
        "sourcePath": "developer-roadmap/roadmaps/ai-red-teaming/content/ai-security-fundamentals@R9DQNc0AyAQ2HLpP4HOk6.md"
      },
      {
        "id": "api-protection@Tszl26iNBnQBdBEWOueDA",
        "title": "API Protection",
        "slug": "api-protection",
        "summary": "AI Red Teamers rigorously test the security of APIs providing access to AI models. They probe for OWASP API Top 10 vulnerabilities like broken authentication/authorization, injection flaws, security misconfigurations, an",
        "sourcePath": "developer-roadmap/roadmaps/ai-red-teaming/content/api-protection@Tszl26iNBnQBdBEWOueDA.md"
      },
      {
        "id": "authentication@J7gjlt2MBx7lOkOnfGvPF",
        "title": "Authentication",
        "slug": "authentication",
        "summary": "AI Red Teamers test the authentication mechanisms controlling access to AI systems and APIs. They attempt to bypass logins, steal or replay API keys/tokens, exploit weak password policies, or find flaws in MFA implementa",
        "sourcePath": "developer-roadmap/roadmaps/ai-red-teaming/content/authentication@J7gjlt2MBx7lOkOnfGvPF.md"
      },
      {
        "id": "authorization@JQ3bR8odXJfd-1RCEf3-Q",
        "title": "Authorization",
        "slug": "authorization",
        "summary": "AI Red Teamers test authorization controls to ensure that authenticated users can only access the AI features and data permitted by their roles/permissions. They attempt privilege escalation, try to access other users' d",
        "sourcePath": "developer-roadmap/roadmaps/ai-red-teaming/content/authorization@JQ3bR8odXJfd-1RCEf3-Q.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/ai-red-teaming"
  },
  {
    "slug": "android",
    "title": "Android",
    "category": "role",
    "description": "A practical path for becoming a stronger Android practitioner, from fundamentals to production-ready work.",
    "topicCount": 114,
    "topics": [
      {
        "id": "activity-lifecycle@FVg438cVBBzqJFkGWVbQM",
        "title": "Activity LifeCycle",
        "slug": "activity-lifecycle",
        "summary": "The Activity lifecycle is a set of states and callbacks that an Activity goes through from creation to destruction. Key callbacks include onCreate, onStart, onResume, onPause, onStop, and onDestroy. Properly implementing",
        "sourcePath": "developer-roadmap/roadmaps/android/content/activity-lifecycle@FVg438cVBBzqJFkGWVbQM.md"
      },
      {
        "id": "activity@nwuVlPmzwJ17mtVQ8Hi9w",
        "title": "Activity",
        "slug": "activity",
        "summary": "An Activity represents a single screen in an Android app with a user interface. Apps are typically made up of multiple activities that users navigate between. Activities have a lifecycle managed by the operating system, ",
        "sourcePath": "developer-roadmap/roadmaps/android/content/activity@nwuVlPmzwJ17mtVQ8Hi9w.md"
      },
      {
        "id": "animations@pHxtpvd7U8CbIW6yebcVX",
        "title": "Animations",
        "slug": "animations",
        "summary": "Animations, in a broad sense, are visual effects that give the impression of movement by rapidly displaying a sequence of images or frames.  In the context of user interfaces, animations enhance the user experience by pr",
        "sourcePath": "developer-roadmap/roadmaps/android/content/animations@pHxtpvd7U8CbIW6yebcVX.md"
      },
      {
        "id": "apollo-android@ww0fTbdXwVr-QIOClU7ng",
        "title": "Apollo-Android",
        "slug": "apollo-android",
        "summary": "Apollo Android is a GraphQL client for Android and Kotlin that generates type-safe Kotlin models from a GraphQL schema and query files. It handles query execution, caching, and subscriptions, and integrates with Kotlin c",
        "sourcePath": "developer-roadmap/roadmaps/android/content/apollo-android@ww0fTbdXwVr-QIOClU7ng.md"
      },
      {
        "id": "app-components@5Li8J5iR_ZuyIlxX0LYei",
        "title": "App Components",
        "slug": "app-components",
        "summary": "App components are the building blocks of an Android application. The four main types are Activities, Services, Broadcast Receivers, and Content Providers. Each serves a different purpose and has its own lifecycle manage",
        "sourcePath": "developer-roadmap/roadmaps/android/content/app-components@5Li8J5iR_ZuyIlxX0LYei.md"
      },
      {
        "id": "app-shortcuts@xV475jHTlLuHtpHZeXb7P",
        "title": "App Shortcuts",
        "slug": "app-shortcuts",
        "summary": "App shortcuts in Android are designed to provide quick and convenient routes to specific actions or functions within your app from the device home screen. To use them, long-press an app's icon and a pop-up menu will appe",
        "sourcePath": "developer-roadmap/roadmaps/android/content/app-shortcuts@xV475jHTlLuHtpHZeXb7P.md"
      },
      {
        "id": "asynchronism@cFYZ2C7yNnY6NHKUNP2Z4",
        "title": "Asynchronism",
        "slug": "asynchronism",
        "summary": "Asynchronism in Android refers to running operations outside the main thread to prevent blocking the UI. Android provides several tools for this: Kotlin Coroutines as the modern recommended approach, Threads for low-leve",
        "sourcePath": "developer-roadmap/roadmaps/android/content/asynchronism@cFYZ2C7yNnY6NHKUNP2Z4.md"
      },
      {
        "id": "authentication@Xv0es_z64vh-QzivMeAT3",
        "title": "Authentication",
        "slug": "authentication",
        "summary": "Firebase Authentication provides backend services for authenticating users with email and password, phone numbers, or federated identity providers like Google, Facebook, and Apple. It manages tokens and session state sec",
        "sourcePath": "developer-roadmap/roadmaps/android/content/authentication@Xv0es_z64vh-QzivMeAT3.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/android"
  },
  {
    "slug": "angular",
    "title": "Angular",
    "category": "skill",
    "description": "A focused learning path for mastering Angular, with concepts, tools, projects, and next steps.",
    "topicCount": 159,
    "topics": [
      {
        "id": "accessibility@VNG9DdXlS6R1OJ6Lrn4Lt",
        "title": "Accessibility",
        "slug": "accessibility",
        "summary": "The web is used by a wide variety of people, including those who have visual or motor impairments. A variety of assistive technologies are available that make it much easier for these groups to interact with web-based so",
        "sourcePath": "developer-roadmap/roadmaps/angular/content/accessibility@VNG9DdXlS6R1OJ6Lrn4Lt.md"
      },
      {
        "id": "analogjs@kauQofxCmpktXPcnzid17",
        "title": "AnalogJS",
        "slug": "analogjs",
        "summary": "AnalogJS is a full-stack meta-framework powered by Vite and Nitro for Angular. Analog supports both Server-Side Rendering (SSR) and Static Site Generation (SSG). Analog uses file-based routing and supports API (server) r",
        "sourcePath": "developer-roadmap/roadmaps/angular/content/analogjs@kauQofxCmpktXPcnzid17.md"
      },
      {
        "id": "angular-and-history@hpShWwL0M57ZAzqkB4I8t",
        "title": "Angular and History",
        "slug": "angular-and-history",
        "summary": "Angular is a TypeScript-based open-source front-end web framework developed and maintained by Google. It is used for building dynamic, single-page web applications (SPAs). Angular provides comprehensive tools, including ",
        "sourcePath": "developer-roadmap/roadmaps/angular/content/angular-and-history@hpShWwL0M57ZAzqkB4I8t.md"
      },
      {
        "id": "angular-architecture@DE3cMpeRYuUPw2ADtfS-3",
        "title": "Angular Architecture",
        "slug": "angular-architecture",
        "summary": "Angular follows a modular architecture pattern, dividing the application into distinct modules, components, services, and other elements, which enhances code organization and maintainability. The key building blocks incl",
        "sourcePath": "developer-roadmap/roadmaps/angular/content/angular-architecture@DE3cMpeRYuUPw2ADtfS-3.md"
      },
      {
        "id": "angular-cli@4YSk6I63Ew--zoXC3xmrC",
        "title": "Angular CLI",
        "slug": "angular-cli",
        "summary": "The Angular CLI is a command-line interface tool that you use to initialize, develop, scaffold, and maintain Angular applications directly from a command shell. we can install angular latest CLI using the following comma",
        "sourcePath": "developer-roadmap/roadmaps/angular/content/angular-cli@4YSk6I63Ew--zoXC3xmrC.md"
      },
      {
        "id": "animation@rYJq59Q0YdfK6n3x740Em",
        "title": "Animation",
        "slug": "animation",
        "summary": "Angular's animation system is built on CSS functionality, which means you can animate any property that the browser considers animatable. This includes positions, sizes, transforms, colors, borders, and more.",
        "sourcePath": "developer-roadmap/roadmaps/angular/content/animation@rYJq59Q0YdfK6n3x740Em.md"
      },
      {
        "id": "aot-compilation@MwtM1UAIfj4FJ-Y4CKDsP",
        "title": "AoT Compilation",
        "slug": "aot-compilation",
        "summary": "Angular applications require a compilation process before they can run in a browser. The Angular ahead-of-time (AOT) compiler converts your Angular HTML and TypeScript code into efficient JavaScript code during the build",
        "sourcePath": "developer-roadmap/roadmaps/angular/content/aot-compilation@MwtM1UAIfj4FJ-Y4CKDsP.md"
      },
      {
        "id": "attribute-binding@FgsSyM6To7irpbivtOLEE",
        "title": "Attribute Binding",
        "slug": "attribute-binding",
        "summary": "Attribute binding in Angular helps you set values for attributes directly. With attribute binding, you can improve accessibility, style your application dynamically, and manage multiple CSS classes or styles simultaneous",
        "sourcePath": "developer-roadmap/roadmaps/angular/content/attribute-binding@FgsSyM6To7irpbivtOLEE.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/angular"
  },
  {
    "slug": "api-design",
    "title": "Api Design",
    "category": "skill",
    "description": "A focused learning path for mastering Api Design, with concepts, tools, projects, and next steps.",
    "topicCount": 99,
    "topics": [
      {
        "id": "abac@dZTe_kxIUQsc9N3w920aR",
        "title": "Attribute Based Access Control (ABAC) - An Authorization Method in API Design",
        "slug": "abac",
        "summary": "Attribute Based Access Control (ABAC) is a flexible and powerful authorization method in the realm of API Design. Distinct from Role-Based Access Control (RBAC), which relies on predefined roles and permissions, ABAC use",
        "sourcePath": "developer-roadmap/roadmaps/api-design/content/abac@dZTe_kxIUQsc9N3w920aR.md"
      },
      {
        "id": "api-documentation-tools@5R9yKfN1vItuv__HgCwP7",
        "title": "API Documentation Tools",
        "slug": "api-documentation-tools",
        "summary": "API Documentation Tools are instrumental in conveying the intricacies of API design to both technical developers and non-technical stakeholders. These tools help in creating comprehensive, easy-to-understand, and searcha",
        "sourcePath": "developer-roadmap/roadmaps/api-design/content/api-documentation-tools@5R9yKfN1vItuv__HgCwP7.md"
      },
      {
        "id": "api-gateways@MJeUD4fOHaJu1oxk4uQ-x",
        "title": "API Gateways",
        "slug": "api-gateways",
        "summary": "API Gateways act as the main point of entry in a microservices architecture, often responsible for request routing, composition, and protocol translation. They play a significant role in API design by providing a shared ",
        "sourcePath": "developer-roadmap/roadmaps/api-design/content/api-gateways@MJeUD4fOHaJu1oxk4uQ-x.md"
      },
      {
        "id": "api-integration-patterns@R3aRhqCslwhegMfHtxg5z",
        "title": "API Integration Patterns",
        "slug": "api-integration-patterns",
        "summary": "API Integration Patterns, in the context of API Design, refers to the common paradigms and approaches used to enable communication between services. These patterns dictate how different APIs interact and exchange data, a",
        "sourcePath": "developer-roadmap/roadmaps/api-design/content/api-integration-patterns@R3aRhqCslwhegMfHtxg5z.md"
      },
      {
        "id": "api-keys--management@tzUJwXu_scwQHnPPT0oY-",
        "title": "API Keys & Management",
        "slug": "api-keys--management",
        "summary": "API keys and management are an integral part of API design. An API key is a unique identifier used to authenticate a user, developer, or calling program to an API. This ensures security and control over API endpoints, as",
        "sourcePath": "developer-roadmap/roadmaps/api-design/content/api-keys--management@tzUJwXu_scwQHnPPT0oY-.md"
      },
      {
        "id": "api-lifecycle-management@At5exN7ZAx2IzY3cTCzHm",
        "title": "API Lifecycle Management",
        "slug": "api-lifecycle-management",
        "summary": "API Lifecycle Management is a crucial aspect in API design that oversees the process of creating, managing, and retiring APIs. This involves various stages from initial planning, designing, testing, deployment, to eventu",
        "sourcePath": "developer-roadmap/roadmaps/api-design/content/api-lifecycle-management@At5exN7ZAx2IzY3cTCzHm.md"
      },
      {
        "id": "api-performance@d9ZXdU73jiCdeNHQv1_DH",
        "title": "API Performance",
        "slug": "api-performance",
        "summary": "When we talk about API design, one crucial aspect that demands our attention is API Performance. API Performance refers to the efficiency and speed at which a developed API can execute tasks and communicate with other pr",
        "sourcePath": "developer-roadmap/roadmaps/api-design/content/api-performance@d9ZXdU73jiCdeNHQv1_DH.md"
      },
      {
        "id": "api-security@qIJ6dUppjAjOTA8eQbp0n",
        "title": "API Security",
        "slug": "api-security",
        "summary": "API Security refers to the practices and products that are used to secure application programming interfaces (APIs). In the context of design, it is an essential component that helps ensure that a deployed API achieves i",
        "sourcePath": "developer-roadmap/roadmaps/api-design/content/api-security@qIJ6dUppjAjOTA8eQbp0n.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/api-design"
  },
  {
    "slug": "aspnet-core",
    "title": "Aspnet Core",
    "category": "skill",
    "description": "A focused learning path for mastering Aspnet Core, with concepts, tools, projects, and next steps.",
    "topicCount": 146,
    "topics": [
      {
        "id": "activemq@sNYYEBMHV_NO_NToP51VY",
        "title": "ActiveMQ",
        "slug": "activemq",
        "summary": "ActiveMQ is an open-source message broker written in Java that implements the Java Message Service (JMS) API. It can be used to send and receive messages between different applications in a loosely coupled, asynchronous ",
        "sourcePath": "developer-roadmap/roadmaps/aspnet-core/content/activemq@sNYYEBMHV_NO_NToP51VY.md"
      },
      {
        "id": "api-clients-and-communication@GLkDH0X0uy8_1DIdCzbUD",
        "title": "API Clients",
        "slug": "api-clients-and-communication",
        "summary": "API clients in [ASP.NET](http://ASP.NET) are software libraries that allow applications to interact with external APIs. They provide a set of methods and classes that make it easy to send requests to an API and process t",
        "sourcePath": "developer-roadmap/roadmaps/aspnet-core/content/api-clients-and-communication@GLkDH0X0uy8_1DIdCzbUD.md"
      },
      {
        "id": "app-settings-and-configs@EJxliq-HPVp00CVsFc6kf",
        "title": "App Settings and Configurations",
        "slug": "app-settings-and-configs",
        "summary": "In the [ASP.NET](http://ASP.NET) Core framework, app settings and configurations refer to the process of storing and managing application-specific settings and configuration data.",
        "sourcePath": "developer-roadmap/roadmaps/aspnet-core/content/app-settings-and-configs@EJxliq-HPVp00CVsFc6kf.md"
      },
      {
        "id": "aspnet-core-basics@v2ZTCQQFQPoJNhOVGMG2g",
        "title": "Basics of ASP.NET Core",
        "slug": "aspnet-core-basics",
        "summary": "[ASP.NET](http://ASP.NET) Core is a open-source, cross-platform web framework for building modern web applications using .NET. Some of the basics of [ASP.NET](http://ASP.NET) Core are Cross-platform, Open-source, Modular",
        "sourcePath": "developer-roadmap/roadmaps/aspnet-core/content/aspnet-core-basics@v2ZTCQQFQPoJNhOVGMG2g.md"
      },
      {
        "id": "autofac@gbpSbjF12dBE1Tb3PX8Bz",
        "title": "Autofac",
        "slug": "autofac",
        "summary": "Autofac is an open-source dependency injection framework for .NET. It is designed to make it easier to manage the dependencies of an application by automatically resolving and managing the lifetime of objects and their d",
        "sourcePath": "developer-roadmap/roadmaps/aspnet-core/content/autofac@gbpSbjF12dBE1Tb3PX8Bz.md"
      },
      {
        "id": "autofixture@K49M_7gSpfJuZaE6WaHxQ",
        "title": "AutoFixture",
        "slug": "autofixture",
        "summary": "AutoFixture is an open-source .NET library designed to minimize the 'Arrange' phase of your unit tests by creating object instances automatically with dummy data. It helps reduce boilerplate code and makes tests easier t",
        "sourcePath": "developer-roadmap/roadmaps/aspnet-core/content/autofixture@K49M_7gSpfJuZaE6WaHxQ.md"
      },
      {
        "id": "automapper@GPmlueMnuLCUW_t4jvGhc",
        "title": "AutoMapper",
        "slug": "automapper",
        "summary": "AutoMapper is a library for .NET that allows you to easily map between objects of different types. It is particularly useful when working with domain models and data transfer objects (DTOs) in a layered architecture. It ",
        "sourcePath": "developer-roadmap/roadmaps/aspnet-core/content/automapper@GPmlueMnuLCUW_t4jvGhc.md"
      },
      {
        "id": "azure-pipelines@_-GQNpsb7KZw76hNNOq3h",
        "title": "Azure Pipelines",
        "slug": "azure-pipelines",
        "summary": "Azure Pipelines is a continuous integration and continuous delivery (CI/CD) platform that allows developers to automate the process of building, testing, and deploying code. It is a part of the Azure DevOps suite of tool",
        "sourcePath": "developer-roadmap/roadmaps/aspnet-core/content/azure-pipelines@_-GQNpsb7KZw76hNNOq3h.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/aspnet-core"
  },
  {
    "slug": "aws",
    "title": "Aws",
    "category": "skill",
    "description": "A focused learning path for mastering Aws, with concepts, tools, projects, and next steps.",
    "topicCount": 101,
    "topics": [
      {
        "id": "amis@AfagmWcllSi81D2XIQz0V",
        "title": "AMIs",
        "slug": "amis",
        "summary": "Amazon Machine Images (AMIs) are pre-configured templates for EC2 instances. When you launch an instance in EC2, you start with an AMI. An AMI includes details such as the operating system to use, applications to install",
        "sourcePath": "developer-roadmap/roadmaps/aws/content/amis@AfagmWcllSi81D2XIQz0V.md"
      },
      {
        "id": "api-gateway@T0dvezPWX6rAiKweT0TkG",
        "title": "API Gateway",
        "slug": "api-gateway",
        "summary": "AWS API Gateway is a fully-managed service that makes it easy to create, publish, maintain, monitor, and secure APIs at any scale. It acts as a \"front door\" for applications to access data, business logic, or functionali",
        "sourcePath": "developer-roadmap/roadmaps/aws/content/api-gateway@T0dvezPWX6rAiKweT0TkG.md"
      },
      {
        "id": "assuming-roles@0IMdO7g_5El1elvDXJJ_0",
        "title": "Assuming Roles",
        "slug": "assuming-roles",
        "summary": "Assuming roles in AWS allows one AWS identity to perform actions and access resources in another AWS account, without having to share security credentials. This is achieved using temporary security credentials. You assum",
        "sourcePath": "developer-roadmap/roadmaps/aws/content/assuming-roles@0IMdO7g_5El1elvDXJJ_0.md"
      },
      {
        "id": "auto-scaling-groups@gBKHVG7FvlCEgINKmw00s",
        "title": "Auto-Scaling Groups",
        "slug": "auto-scaling-groups",
        "summary": "\"Autoscaling Groups\" in AWS, also known as Auto Scaling Groups (ASGs), are the main components used for scaling resources automatically according to your requirements in AWS. They contain a collection of Amazon Elastic C",
        "sourcePath": "developer-roadmap/roadmaps/aws/content/auto-scaling-groups@gBKHVG7FvlCEgINKmw00s.md"
      },
      {
        "id": "auto-scaling@dOAZG-NbjWiVdPKYEhWxj",
        "title": "Auto-Scaling",
        "slug": "auto-scaling",
        "summary": "AWS Auto Scaling is a service that automatically scales resources to meet the demands of your applications. It uses policies, health status, and schedules to determine when to add more instances, ensuring that your appli",
        "sourcePath": "developer-roadmap/roadmaps/aws/content/auto-scaling@dOAZG-NbjWiVdPKYEhWxj.md"
      },
      {
        "id": "aws-global-infrastructure@z9R1BWUGalmnw0E7QqiW6",
        "title": "AWS Global Infrastructure",
        "slug": "aws-global-infrastructure",
        "summary": "AWS Global Infrastructure refers to the layout of AWS regions and availability zones around the world. A region is a geographical area, each consisting of two or more availability zones (AZs) which are engineered to be i",
        "sourcePath": "developer-roadmap/roadmaps/aws/content/aws-global-infrastructure@z9R1BWUGalmnw0E7QqiW6.md"
      },
      {
        "id": "backup--restore@NWvasq-AcwxmOKZPDv3ue",
        "title": "Backup / Restore",
        "slug": "backup--restore",
        "summary": "In AWS, DynamoDB has built-in support for data backup and restore features. This includes both on-demand and continuous backups. On-demand backups allow you to create complete backups of your tables for long-term retenti",
        "sourcePath": "developer-roadmap/roadmaps/aws/content/backup--restore@NWvasq-AcwxmOKZPDv3ue.md"
      },
      {
        "id": "backup--restore@tBKc7tHOiJaTmwEl3q--Y",
        "title": "Backup / Restore",
        "slug": "backup--restore",
        "summary": "`Backup Restore` in AWS RDS provides the ability to restore your DB instance to a specific point in time. When you initiate a point-in-time restore, a new DB instance is created and all transactions that occurred after t",
        "sourcePath": "developer-roadmap/roadmaps/aws/content/backup--restore@tBKc7tHOiJaTmwEl3q--Y.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/aws"
  },
  {
    "slug": "backend-beginner",
    "title": "Backend Beginner",
    "category": "skill",
    "description": "A focused learning path for mastering Backend Beginner, with concepts, tools, projects, and next steps.",
    "topicCount": 27,
    "topics": [
      {
        "id": "acid@qSAdfaGUfn8mtmDjHJi3z",
        "title": "ACID",
        "slug": "acid",
        "summary": "ACID represents four database transaction properties: Atomicity (all-or-nothing execution), Consistency (valid state maintenance), Isolation (concurrent transaction separation), and Durability (permanent commit survival)",
        "sourcePath": "developer-roadmap/roadmaps/backend-beginner/content/acid@qSAdfaGUfn8mtmDjHJi3z.md"
      },
      {
        "id": "authentication@PY9G7KQy8bF6eIdr1ydHf",
        "title": "Authentication",
        "slug": "authentication",
        "summary": "API authentication verifies client identity to ensure only authorized access to resources. Common methods include API keys, OAuth 2.0, JWT, and basic auth. It protects data, prevents unauthorized access, enables usage tr",
        "sourcePath": "developer-roadmap/roadmaps/backend-beginner/content/authentication@PY9G7KQy8bF6eIdr1ydHf.md"
      },
      {
        "id": "caching@ELj8af7Mi38kUbaPJfCUR",
        "title": "Caching",
        "slug": "caching",
        "summary": "Caching stores frequently accessed data in faster locations to improve performance by reducing latency and server load. It operates at the browser, application, and database levels using strategies like LRU and time-base",
        "sourcePath": "developer-roadmap/roadmaps/backend-beginner/content/caching@ELj8af7Mi38kUbaPJfCUR.md"
      },
      {
        "id": "functional-testing@NAGisfq2CgeK3SsuRjnMw",
        "title": "Functional Testing",
        "slug": "functional-testing",
        "summary": "Functional testing ensures software meets functional requirements through black box testing. Testers provide input and compare expected vs actual output without understanding the source code. Contrasts with non-functiona",
        "sourcePath": "developer-roadmap/roadmaps/backend-beginner/content/functional-testing@NAGisfq2CgeK3SsuRjnMw.md"
      },
      {
        "id": "git@_I1E__wCIVrhjMk6IMieE",
        "title": "Git",
        "slug": "git",
        "summary": "Git is a distributed version control system used to track changes in source code during software development. It enables multiple developers to collaborate on a project by managing versions of code, allowing for branchin",
        "sourcePath": "developer-roadmap/roadmaps/backend-beginner/content/git@_I1E__wCIVrhjMk6IMieE.md"
      },
      {
        "id": "github@ptD8EVqwFUYr4W5A_tABY",
        "title": "GitHub",
        "slug": "github",
        "summary": "GitHub is a web-based platform built on top of Git that provides version control, collaboration tools, and project management features for software development. It enables developers to host Git repositories, collaborate",
        "sourcePath": "developer-roadmap/roadmaps/backend-beginner/content/github@ptD8EVqwFUYr4W5A_tABY.md"
      },
      {
        "id": "go@BdXbcz4-ar3XOX0wIKzBp",
        "title": "Go",
        "slug": "go",
        "summary": "Go (Golang) is Google's statically typed, compiled language combining efficiency with ease of use. Features built-in concurrency via goroutines and channels, simple syntax, fast compilation, and a comprehensive standard ",
        "sourcePath": "developer-roadmap/roadmaps/backend-beginner/content/go@BdXbcz4-ar3XOX0wIKzBp.md"
      },
      {
        "id": "index",
        "title": "Index",
        "slug": "index",
        "summary": "Explore the core ideas behind Index.",
        "sourcePath": "developer-roadmap/roadmaps/backend-beginner/content/index.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/backend-beginner"
  },
  {
    "slug": "bi-analyst",
    "title": "Bi Analyst",
    "category": "role",
    "description": "A practical path for becoming a stronger Bi Analyst practitioner, from fundamentals to production-ready work.",
    "topicCount": 203,
    "topics": [
      {
        "id": "ab-testing@qKlo90-Cy8t_off5Qv8-6",
        "title": "A/B Testing",
        "slug": "ab-testing",
        "summary": "A/B testing, also known as split testing, is a method of comparing two versions of something to determine which one performs better. This is done by showing the two versions (A and B) to similar audiences and measuring w",
        "sourcePath": "developer-roadmap/roadmaps/bi-analyst/content/ab-testing@qKlo90-Cy8t_off5Qv8-6.md"
      },
      {
        "id": "accesibility@BiyrAHB34evej_0cnDzOa",
        "title": "Data Accessibility",
        "slug": "accesibility",
        "summary": "Data accessibility refers to the ease with which individuals or systems can locate, retrieve, and utilize data. It encompasses factors like data discoverability, format compatibility, and the presence of appropriate perm",
        "sourcePath": "developer-roadmap/roadmaps/bi-analyst/content/accesibility@BiyrAHB34evej_0cnDzOa.md"
      },
      {
        "id": "accessibility@wtEzdO_ZNu9jHJrFS3CrG",
        "title": "Accessibility in Data Visualization",
        "slug": "accessibility",
        "summary": "Accessibility in data visualization focuses on designing charts and graphs that are usable by everyone, including people with disabilities. This involves considering factors like color contrast, alternative text for scre",
        "sourcePath": "developer-roadmap/roadmaps/bi-analyst/content/accessibility@wtEzdO_ZNu9jHJrFS3CrG.md"
      },
      {
        "id": "accuracy@M1H3Fh09v8udCJIPSJPic",
        "title": "Accuracy",
        "slug": "accuracy",
        "summary": "Accuracy refers to the degree to which data correctly reflects the real-world object or event it is intended to represent. It ensures that the data values are correct, reliable, and free from errors, misrepresentations, ",
        "sourcePath": "developer-roadmap/roadmaps/bi-analyst/content/accuracy@M1H3Fh09v8udCJIPSJPic.md"
      },
      {
        "id": "advanced-queries@-gbb16Wl--Rjx5aoM0krL",
        "title": "Advanced SQL Queries",
        "slug": "advanced-queries",
        "summary": "Advanced SQL queries go beyond basic data retrieval and manipulation. They involve using more complex techniques like subqueries, window functions, common table expressions (CTEs), and stored procedures to analyze data i",
        "sourcePath": "developer-roadmap/roadmaps/bi-analyst/content/advanced-queries@-gbb16Wl--Rjx5aoM0krL.md"
      },
      {
        "id": "airflow@qnUHw2f2VmTPU3-NMnoLl",
        "title": "Airflow",
        "slug": "airflow",
        "summary": "Airflow is a platform to programmatically author, schedule and monitor workflows. Use airflow to author workflows as directed acyclic graphs (DAGs) of tasks. The airflow scheduler executes your tasks on an array of worke",
        "sourcePath": "developer-roadmap/roadmaps/bi-analyst/content/airflow@qnUHw2f2VmTPU3-NMnoLl.md"
      },
      {
        "id": "algorithmic-bias@_uLtsnyNNNRcz5A29Zpjl",
        "title": "Algorithmic Bias",
        "slug": "algorithmic-bias",
        "summary": "Algorithmic bias occurs when a computer system reflects the implicit values of the humans who created the algorithm or the data used to train it. This can lead to unfair or discriminatory outcomes for certain groups of p",
        "sourcePath": "developer-roadmap/roadmaps/bi-analyst/content/algorithmic-bias@_uLtsnyNNNRcz5A29Zpjl.md"
      },
      {
        "id": "analog-vs-digital-data@kb216tShKrRPWv7mE9sVa",
        "title": "Analog vs. Digital Data",
        "slug": "analog-vs-digital-data",
        "summary": "Analog data is continuous information represented by physical quantities, like sound waves or temperature, that vary smoothly over time. Digital data, on the other hand, is discrete information represented by numerical v",
        "sourcePath": "developer-roadmap/roadmaps/bi-analyst/content/analog-vs-digital-data@kb216tShKrRPWv7mE9sVa.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/bi-analyst"
  },
  {
    "slug": "blockchain",
    "title": "Blockchain",
    "category": "role",
    "description": "A practical path for becoming a stronger Blockchain practitioner, from fundamentals to production-ready work.",
    "topicCount": 127,
    "topics": [
      {
        "id": "alchemy@lOoubzXNILBk18jGsc-JX",
        "title": "Alchemy",
        "slug": "alchemy",
        "summary": "Alchemy is a platform that provides developers with the infrastructure and tools needed to build and scale decentralized applications (dApps). It simplifies the process of interacting with blockchain networks by offering",
        "sourcePath": "developer-roadmap/roadmaps/blockchain/content/alchemy@lOoubzXNILBk18jGsc-JX.md"
      },
      {
        "id": "angular@UY_vAsixTyocvo8zvAF4b",
        "title": "Angular",
        "slug": "angular",
        "summary": "Angular is a TypeScript-based, open-source web application framework led by the Angular Team at Google. It provides a structured way to build dynamic web applications, using components, templates, and dependency injectio",
        "sourcePath": "developer-roadmap/roadmaps/blockchain/content/angular@UY_vAsixTyocvo8zvAF4b.md"
      },
      {
        "id": "applicability@aATSuiqPG-yctr3ChEBa_",
        "title": "Applicability",
        "slug": "applicability",
        "summary": "dApps can be used for just about anything that requires two or more parties to agree on something. When the appropriate conditions are met, the smart contract will execute automatically. An important differentiation is t",
        "sourcePath": "developer-roadmap/roadmaps/blockchain/content/applicability@aATSuiqPG-yctr3ChEBa_.md"
      },
      {
        "id": "applications-and-uses@WD2JH4X4tEE4J0W0XFQ_4",
        "title": "Blockchain Applications and Uses",
        "slug": "applications-and-uses",
        "summary": "Blockchain technology enables secure and transparent record-keeping across various sectors. It's used to track goods as they move through supply chains, ensuring authenticity and reducing fraud. Digital identities can be",
        "sourcePath": "developer-roadmap/roadmaps/blockchain/content/applications-and-uses@WD2JH4X4tEE4J0W0XFQ_4.md"
      },
      {
        "id": "arbitrum@A_yVDg-6b42ynmh71jk1V",
        "title": "Arbitrum",
        "slug": "arbitrum",
        "summary": "Arbitrum is a Layer-2 scaling solution designed to improve the speed and reduce the costs of transactions on the Ethereum blockchain. It operates by executing transactions off-chain and then posting the results back to t",
        "sourcePath": "developer-roadmap/roadmaps/blockchain/content/arbitrum@A_yVDg-6b42ynmh71jk1V.md"
      },
      {
        "id": "architecture@B6GGTUbzEaIz5yu32WrAq",
        "title": "dApp Architecture",
        "slug": "architecture",
        "summary": "Traditional web applications typically rely on a centralized server to handle data storage, logic, and user authentication. In contrast, decentralized applications (dApps) shift these responsibilities to a decentralized ",
        "sourcePath": "developer-roadmap/roadmaps/blockchain/content/architecture@B6GGTUbzEaIz5yu32WrAq.md"
      },
      {
        "id": "avalanche@txQ9U1wcnZkQVh6B49krk",
        "title": "Avalanche",
        "slug": "avalanche",
        "summary": "Avalanche is a high-throughput, open-source platform for launching decentralized finance (DeFi) applications and enterprise blockchain deployments in one interoperable, highly scalable ecosystem. It distinguishes itself ",
        "sourcePath": "developer-roadmap/roadmaps/blockchain/content/avalanche@txQ9U1wcnZkQVh6B49krk.md"
      },
      {
        "id": "base@ixTIn2Uhs-i5-UPt9jKAa",
        "title": "Base",
        "slug": "base",
        "summary": "Base is an Ethereum Layer 2 (L2) blockchain developed by Coinbase. It's designed to offer a secure, low-cost, and developer-friendly environment for building decentralized applications (dApps). Base aims to scale Ethereu",
        "sourcePath": "developer-roadmap/roadmaps/blockchain/content/base@ixTIn2Uhs-i5-UPt9jKAa.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/blockchain"
  },
  {
    "slug": "c",
    "title": "C",
    "category": "skill",
    "description": "A focused learning path for mastering C, with concepts, tools, projects, and next steps.",
    "topicCount": 147,
    "topics": [
      {
        "id": "_atomic@uDFazTncdICtqZyGIv3iZ",
        "title": "_Atomic",
        "slug": "_atomic",
        "summary": "The `_Atomic` qualifier, introduced in C11, marks a variable so that reads and writes to it happen as a single, indivisible operation, even when accessed from multiple threads. This prevents data races on that variable w",
        "sourcePath": "developer-roadmap/roadmaps/c/content/_atomic@uDFazTncdICtqZyGIv3iZ.md"
      },
      {
        "id": "abi@YclFmrSZ3LcNxnXHU5zl-",
        "title": "ABI",
        "slug": "abi",
        "summary": "An ABI (Application Binary Interface) defines the low-level conventions that compiled code must follow to be compatible with other compiled code, including how function arguments are passed, how data is laid out in memor",
        "sourcePath": "developer-roadmap/roadmaps/c/content/abi@YclFmrSZ3LcNxnXHU5zl-.md"
      },
      {
        "id": "applications@0jSjJfj-xvSsrmjrKscuq",
        "title": "Applications",
        "slug": "applications",
        "summary": "C shows up in operating system kernels (Linux, Windows internals), embedded systems and microcontrollers, device drivers, database engines, and performance-critical libraries. Many other languages, including Python and R",
        "sourcePath": "developer-roadmap/roadmaps/c/content/applications@0jSjJfj-xvSsrmjrKscuq.md"
      },
      {
        "id": "arithmetic@TqVZuxNp423auXIPmolrX",
        "title": "Arithmetic",
        "slug": "arithmetic",
        "summary": "Arithmetic operators perform basic mathematical operations: `+` for addition, `-` for subtraction, `*` for multiplication, `/` for division, and `%` for remainder (modulo). Division between two integers truncates toward ",
        "sourcePath": "developer-roadmap/roadmaps/c/content/arithmetic@TqVZuxNp423auXIPmolrX.md"
      },
      {
        "id": "arrays@ZKpnuEvqZFm4cyzF43jSb",
        "title": "Arrays",
        "slug": "arrays",
        "summary": "An array in C is a fixed-size, contiguous block of memory holding multiple elements of the same type, accessed using an index starting at zero. The size of an array must be known at compile time unless it is allocated dy",
        "sourcePath": "developer-roadmap/roadmaps/c/content/arrays@ZKpnuEvqZFm4cyzF43jSb.md"
      },
      {
        "id": "asan--lsan@SOpS0quLuuiL0NlGPMtJg",
        "title": "ASan & LSan",
        "slug": "asan--lsan",
        "summary": "AddressSanitizer (ASan) and LeakSanitizer (LSan) are compiler-integrated tools, enabled with a flag like `-fsanitize=address`, that detect memory errors and leaks respectively by instrumenting the compiled code to check ",
        "sourcePath": "developer-roadmap/roadmaps/c/content/asan--lsan@SOpS0quLuuiL0NlGPMtJg.md"
      },
      {
        "id": "asserth@oGePVWBoGQyGvNOqbW7qs",
        "title": "assert.h",
        "slug": "asserth",
        "summary": "`<assert.h>` provides the `assert` macro, which checks that a given condition is true and, if not, prints an error message with the file and line number before terminating the program. It is commonly used during developm",
        "sourcePath": "developer-roadmap/roadmaps/c/content/asserth@oGePVWBoGQyGvNOqbW7qs.md"
      },
      {
        "id": "basic-functions@I5qOTKJFzAYoLMBiReGdX",
        "title": "Basic Functions",
        "slug": "basic-functions",
        "summary": "A basic function definition in C specifies a return type, a name, a parameter list, and a body containing the code to execute, for example `int add(int a, int b) { return a + b; }`. If a function does not return a value,",
        "sourcePath": "developer-roadmap/roadmaps/c/content/basic-functions@I5qOTKJFzAYoLMBiReGdX.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/c"
  },
  {
    "slug": "claude-code",
    "title": "Claude Code",
    "category": "skill",
    "description": "A focused learning path for mastering Claude Code, with concepts, tools, projects, and next steps.",
    "topicCount": 116,
    "topics": [
      {
        "id": "@La3uarrUxC5oTszf4oaWr",
        "title": "File Path Mentions (@)",
        "slug": "",
        "summary": "File path mentions, triggered by typing the `@` symbol followed by a filename or folder, allow you to manually point the AI toward specific parts of your codebase. This creates a direct reference that prioritizes those f",
        "sourcePath": "developer-roadmap/roadmaps/claude-code/content/@La3uarrUxC5oTszf4oaWr.md"
      },
      {
        "id": "@N6z45nuFeUqRB2f-8b_Ku",
        "title": "Multiline input ()",
        "slug": "",
        "summary": "Multiline input allows you to format complex instructions across several lines without immediately sending the prompt to the AI. The fastest way to create multiline input is by typing `\\` followed by `Enter`. This works ",
        "sourcePath": "developer-roadmap/roadmaps/claude-code/content/@N6z45nuFeUqRB2f-8b_Ku.md"
      },
      {
        "id": "@PYjuzInrTOWebl-OyYfMa",
        "title": "Bash Mode (!)",
        "slug": "",
        "summary": "Bash Mode (triggered by prefixing your input with an exclamation mark !) is a powerful feature that allows you to execute shell commands directly on your machine without involving the Claude Code's reasoning or consuming",
        "sourcePath": "developer-roadmap/roadmaps/claude-code/content/@PYjuzInrTOWebl-OyYfMa.md"
      },
      {
        "id": "add-dir@FgQXBQ6oJ5sfW_ar0u6ez",
        "title": "claude --add-dir",
        "slug": "add-dir",
        "summary": "The `claude --add-dir` command is a startup flag that allows you to include extra folders in your working session before the interface even opens. By providing one or more directory paths when you launch the tool (for ex",
        "sourcePath": "developer-roadmap/roadmaps/claude-code/content/add-dir@FgQXBQ6oJ5sfW_ar0u6ez.md"
      },
      {
        "id": "agent-team@fI90DtG5CoZbDyJUqLGoy",
        "title": "Agent Team",
        "slug": "agent-team",
        "summary": "Agent Teams are an experimental multi-agent orchestration feature in Claude Code that allows you to coordinate multiple AI instances working in parallel on a single project. Agent Teams function as a collaborative networ",
        "sourcePath": "developer-roadmap/roadmaps/claude-code/content/agent-team@fI90DtG5CoZbDyJUqLGoy.md"
      },
      {
        "id": "agents@sx2GRmZbQEYxeb05HpHQH",
        "title": "/agents",
        "slug": "agents",
        "summary": "The `/agents` command is a specialized management interface used to create, configure, and orchestrate sub-agents within your Claude Code environment. This command transitions from a single-assistant model to a multi-age",
        "sourcePath": "developer-roadmap/roadmaps/claude-code/content/agents@sx2GRmZbQEYxeb05HpHQH.md"
      },
      {
        "id": "api-usage@N6dDyEXIUJUA3-o1J9K_n",
        "title": "API Usage",
        "slug": "api-usage",
        "summary": "Claude Console authentication uses a pay-as-you-go model where the tool connects directly to the Anthropic API using a personal API key rather than a flat-rate monthly subscription. To set this up, you must first create ",
        "sourcePath": "developer-roadmap/roadmaps/claude-code/content/api-usage@N6dDyEXIUJUA3-o1J9K_n.md"
      },
      {
        "id": "be-mindful-of-extensions@__3S2Z00hK_g_GQJxv_21",
        "title": "Be mindful of extensions",
        "slug": "be-mindful-of-extensions",
        "summary": "Carefully managing extensions, such as MCP servers, skills, and subagents, is vital because every active integration consumes a portion of Claude’s finite context window, and excessive \"context pollution\" can lead to deg",
        "sourcePath": "developer-roadmap/roadmaps/claude-code/content/be-mindful-of-extensions@__3S2Z00hK_g_GQJxv_21.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/claude-code"
  },
  {
    "slug": "code-review",
    "title": "Code Review",
    "category": "skill",
    "description": "A focused learning path for mastering Code Review, with concepts, tools, projects, and next steps.",
    "topicCount": 6,
    "topics": [
      {
        "id": "api-semantics",
        "title": "Questions to Ask",
        "slug": "api-semantics",
        "summary": "Learn more from the following resources:",
        "sourcePath": "developer-roadmap/roadmaps/code-review/content/api-semantics.md"
      },
      {
        "id": "code-style",
        "title": "Questions to Ask",
        "slug": "code-style",
        "summary": "Learn more from the following resources:",
        "sourcePath": "developer-roadmap/roadmaps/code-review/content/code-style.md"
      },
      {
        "id": "documentation",
        "title": "Questions to Ask",
        "slug": "documentation",
        "summary": "Learn more from the following resources:",
        "sourcePath": "developer-roadmap/roadmaps/code-review/content/documentation.md"
      },
      {
        "id": "implementation-semantics",
        "title": "Questions to Ask",
        "slug": "implementation-semantics",
        "summary": "Learn more from the following resources:",
        "sourcePath": "developer-roadmap/roadmaps/code-review/content/implementation-semantics.md"
      },
      {
        "id": "index",
        "title": "Index",
        "slug": "index",
        "summary": "Learn more from the following resources:",
        "sourcePath": "developer-roadmap/roadmaps/code-review/content/index.md"
      },
      {
        "id": "tests",
        "title": "Questions to Ask",
        "slug": "tests",
        "summary": "Learn more from the following resources:",
        "sourcePath": "developer-roadmap/roadmaps/code-review/content/tests.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/code-review"
  },
  {
    "slug": "cpp",
    "title": "Cpp",
    "category": "skill",
    "description": "A focused learning path for mastering Cpp, with concepts, tools, projects, and next steps.",
    "topicCount": 127,
    "topics": [
      {
        "id": "access-violations@y4-P4UNC--rE1vni8HdTn",
        "title": "Access Violations",
        "slug": "access-violations",
        "summary": "An access violation occurs when a program tries to read from or write to a memory location that it doesn't have permission to access. This is a common error in C++ that can arise from issues like dereferencing null or in",
        "sourcePath": "developer-roadmap/roadmaps/cpp/content/access-violations@y4-P4UNC--rE1vni8HdTn.md"
      },
      {
        "id": "algorithms@whyj6Z4RXFsVQYRfYYn7B",
        "title": "STL Algorithms",
        "slug": "algorithms",
        "summary": "The C++ Standard Template Library (STL) offers a rich collection of generic algorithms that operate on various container types. These algorithms, found primarily in the `<algorithm>` header, provide functionalities for c",
        "sourcePath": "developer-roadmap/roadmaps/cpp/content/algorithms@whyj6Z4RXFsVQYRfYYn7B.md"
      },
      {
        "id": "argument-dependent-lookup-adl@YSWN7nS8vA9nMldSUrZRT",
        "title": "Argument Dependent Lookup (ADL)",
        "slug": "argument-dependent-lookup-adl",
        "summary": "Argument Dependent Lookup (ADL), also known as Koenig Lookup, is a feature in C++ that extends the function lookup process by allowing the compiler to search for functions in the namespaces of the function arguments' typ",
        "sourcePath": "developer-roadmap/roadmaps/cpp/content/argument-dependent-lookup-adl@YSWN7nS8vA9nMldSUrZRT.md"
      },
      {
        "id": "arithmetic-operators@8aOSpZLWwZv_BEYiurhyR",
        "title": "Arithmetic Operators",
        "slug": "arithmetic-operators",
        "summary": "Arithmetic operators are fundamental building blocks in C++ programming, allowing you to perform mathematical calculations directly within your code. These operators work on numeric data types such as integers and floati",
        "sourcePath": "developer-roadmap/roadmaps/cpp/content/arithmetic-operators@8aOSpZLWwZv_BEYiurhyR.md"
      },
      {
        "id": "auto-automatic-type-deduction@CG01PTVgHtjfKvsJkJLGl",
        "title": "Auto Type Deduction",
        "slug": "auto-automatic-type-deduction",
        "summary": "`auto` is a keyword in C++ introduced in C++11 that enables automatic type deduction. It allows the compiler to infer the data type of a variable from its initialization expression at compile time. This simplifies code b",
        "sourcePath": "developer-roadmap/roadmaps/cpp/content/auto-automatic-type-deduction@CG01PTVgHtjfKvsJkJLGl.md"
      },
      {
        "id": "basic-operations@kl2JI_Wl47c5r8SYzxvCq",
        "title": "Basic Operations",
        "slug": "basic-operations",
        "summary": "Understanding fundamental operations is crucial for any C++ developer. This foundational knowledge includes arithmetic operations such as addition, subtraction, multiplication, and division, as well as comparison operati",
        "sourcePath": "developer-roadmap/roadmaps/cpp/content/basic-operations@kl2JI_Wl47c5r8SYzxvCq.md"
      },
      {
        "id": "bitwise-operators@zE4iPSq2KsrDSByQ0sGK_",
        "title": "Bitwise Operators",
        "slug": "bitwise-operators",
        "summary": "Bitwise operators in C++ allow direct manipulation of individual bits within integer data types. These operators work by treating values as sequences of bits and performing operations at the bit level. Common bitwise ope",
        "sourcePath": "developer-roadmap/roadmaps/cpp/content/bitwise-operators@zE4iPSq2KsrDSByQ0sGK_.md"
      },
      {
        "id": "boost@1d7h5P1Q0RVHryKPVogQy",
        "title": "Boost",
        "slug": "boost",
        "summary": "Boost is a set of peer-reviewed, portable C++ source libraries. It provides a wide range of utilities and tools that can significantly enhance your C++ development, covering areas like data structures, algorithms, mathem",
        "sourcePath": "developer-roadmap/roadmaps/cpp/content/boost@1d7h5P1Q0RVHryKPVogQy.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/cpp"
  },
  {
    "slug": "css",
    "title": "Css",
    "category": "skill",
    "description": "A focused learning path for mastering Css, with concepts, tools, projects, and next steps.",
    "topicCount": 104,
    "topics": [
      {
        "id": "absolute-vs-relative@l7bBJLtKWkrzSfSPkZlBI",
        "title": "Absolute vs. Relative Units",
        "slug": "absolute-vs-relative",
        "summary": "Absolute units in CSS represent fixed measurements, like pixels (px) or inches (in), and will always render at the same size regardless of screen size or other factors. Relative units, on the other hand, are based on oth",
        "sourcePath": "developer-roadmap/roadmaps/css/content/absolute-vs-relative@l7bBJLtKWkrzSfSPkZlBI.md"
      },
      {
        "id": "absolute@7LhPT3h-BEdHSF2iOevVl",
        "title": "Absolute Positioning",
        "slug": "absolute",
        "summary": "Absolute positioning in CSS allows you to precisely place an element relative to its nearest positioned ancestor (an ancestor with a position value other than `static`). If no such ancestor exists, the element is positio",
        "sourcePath": "developer-roadmap/roadmaps/css/content/absolute@7LhPT3h-BEdHSF2iOevVl.md"
      },
      {
        "id": "accessibility@LDIZoK-XgmwqPdLH01vC5",
        "title": "Accessibility",
        "slug": "accessibility",
        "summary": "Accessibility in CSS focuses on creating web content that is usable by everyone, regardless of their abilities or disabilities. This involves using semantic HTML, providing alternative text for images, ensuring sufficien",
        "sourcePath": "developer-roadmap/roadmaps/css/content/accessibility@LDIZoK-XgmwqPdLH01vC5.md"
      },
      {
        "id": "attribute-selectors@m6KQMN1XWo4uWqs2F3KXH",
        "title": "Attribute Selectors",
        "slug": "attribute-selectors",
        "summary": "Attribute selectors in CSS target HTML elements based on the presence or value of their attributes. They allow you to style elements more precisely than using just tag names or classes. For example, you can select all el",
        "sourcePath": "developer-roadmap/roadmaps/css/content/attribute-selectors@m6KQMN1XWo4uWqs2F3KXH.md"
      },
      {
        "id": "background-attachment@6i0Zl05VMzUsh47cuUH4-",
        "title": "Background Attachment",
        "slug": "background-attachment",
        "summary": "Background attachment in CSS controls how a background image behaves when the page is scrolled. It determines whether the background image scrolls along with the content or remains fixed in place. This property is useful",
        "sourcePath": "developer-roadmap/roadmaps/css/content/background-attachment@6i0Zl05VMzUsh47cuUH4-.md"
      },
      {
        "id": "background-color@ATd9RE303X79aAmqvwS08",
        "title": "Background Color",
        "slug": "background-color",
        "summary": "Background color in CSS sets the color of an element's background. It fills the entire box of an element, including padding, but not the border or margin. You can specify the color using color names (like \"red\"), hexadec",
        "sourcePath": "developer-roadmap/roadmaps/css/content/background-color@ATd9RE303X79aAmqvwS08.md"
      },
      {
        "id": "background-gradient@_9QA5_mLJ8_eiQN0ucIkQ",
        "title": "Background Gradient",
        "slug": "background-gradient",
        "summary": "Background gradients in CSS allow you to create smooth transitions between two or more colors for the background of an element. Instead of a solid color, you can define a gradient that blends colors together, adding visu",
        "sourcePath": "developer-roadmap/roadmaps/css/content/background-gradient@_9QA5_mLJ8_eiQN0ucIkQ.md"
      },
      {
        "id": "background-image@d-rp-EHKyHnzuIHWHOc7C",
        "title": "Background Image",
        "slug": "background-image",
        "summary": "A background image in CSS lets you add an image to the background of an HTML element. This image can be a simple pattern, a photograph, or any other visual element you want to display behind the content of your element. ",
        "sourcePath": "developer-roadmap/roadmaps/css/content/background-image@d-rp-EHKyHnzuIHWHOc7C.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/css"
  },
  {
    "slug": "datastructures-and-algorithms",
    "title": "Data Structures & Algorithms",
    "category": "skill",
    "description": "A focused learning path for mastering Data Structures & Algorithms, with concepts, tools, projects, and next steps.",
    "topicCount": 107,
    "topics": [
      {
        "id": "2-3-trees@o0fNAhJ1LsCdmGzY2ni_x",
        "title": "Complex Data Structures",
        "slug": "2-3-trees",
        "summary": "Complex data structures are advanced structures that are used for storing and organizing data in a more specialized way to manage larger amounts of data more effectively. These include Trees, Graphs, Hash Tables, and Hea",
        "sourcePath": "developer-roadmap/roadmaps/datastructures-and-algorithms/content/2-3-trees@o0fNAhJ1LsCdmGzY2ni_x.md"
      },
      {
        "id": "a-algorithm@AabJqPUwFVBVS02YPDPvL",
        "title": "A* Algorithm",
        "slug": "a-algorithm",
        "summary": "A* is a pathfinding and graph traversal algorithm that finds the shortest path between two nodes. It combines the guarantees of Dijkstra's algorithm with a heuristic that estimates the remaining distance, guiding the sea",
        "sourcePath": "developer-roadmap/roadmaps/datastructures-and-algorithms/content/a-algorithm@AabJqPUwFVBVS02YPDPvL.md"
      },
      {
        "id": "advanced-data-structures@KnyUHDvpDTUO0EkAs9pT8",
        "title": "Advanced Data Structures",
        "slug": "advanced-data-structures",
        "summary": "Advanced data structures are an integral part of advanced programming. They include structures such as Binary Search Trees (BST), Balanced trees like AVL Trees, Red-Black Trees, Heap, Disjoint Data Set, Trie, Suffix Arra",
        "sourcePath": "developer-roadmap/roadmaps/datastructures-and-algorithms/content/advanced-data-structures@KnyUHDvpDTUO0EkAs9pT8.md"
      },
      {
        "id": "algorithmic-complexity@VotdHk0_bI3CeoIf-KoKu",
        "title": "Algorithmic Complexity",
        "slug": "algorithmic-complexity",
        "summary": "\"Algorithmic Complexity\" refers to the computing resources needed by an algorithm to solve a problem. These computing resources can be the time taken for program execution (time complexity), or the space used in memory d",
        "sourcePath": "developer-roadmap/roadmaps/datastructures-and-algorithms/content/algorithmic-complexity@VotdHk0_bI3CeoIf-KoKu.md"
      },
      {
        "id": "array@lxY3ErxJ_D3zkSAXIBUpv",
        "title": "Array",
        "slug": "array",
        "summary": "Explore the core ideas behind Array.",
        "sourcePath": "developer-roadmap/roadmaps/datastructures-and-algorithms/content/array@lxY3ErxJ_D3zkSAXIBUpv.md"
      },
      {
        "id": "asymptotic-notation@v0LrabYYOKzV4oCXOK2Rs",
        "title": "Asymptotic Notation",
        "slug": "asymptotic-notation",
        "summary": "Asymptotic notation is a way to describe the limiting behavior of a function, typically representing the time or space complexity of an algorithm, as the input size grows. It focuses on the dominant terms and ignores con",
        "sourcePath": "developer-roadmap/roadmaps/datastructures-and-algorithms/content/asymptotic-notation@v0LrabYYOKzV4oCXOK2Rs.md"
      },
      {
        "id": "avl-trees@5MCgKpylPzDZaGBEUU51r",
        "title": "AVL Trees",
        "slug": "avl-trees",
        "summary": "An **AVL tree** is a type of binary search tree that is self-balancing, which means the heights of the two child subtrees of any node in the tree differ by at most one. If at any point the difference becomes greater than",
        "sourcePath": "developer-roadmap/roadmaps/datastructures-and-algorithms/content/avl-trees@5MCgKpylPzDZaGBEUU51r.md"
      },
      {
        "id": "b-trees@2F6BcbAzICynOK3oEj-Is",
        "title": "B-Trees",
        "slug": "b-trees",
        "summary": "B-Tree is a self-balanced search tree data structure that maintains sorted data and allows for efficient insertion, deletion, and search operations. It is most commonly used in systems where read and write operations are",
        "sourcePath": "developer-roadmap/roadmaps/datastructures-and-algorithms/content/b-trees@2F6BcbAzICynOK3oEj-Is.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/datastructures-and-algorithms"
  },
  {
    "slug": "design-system",
    "title": "Design System",
    "category": "skill",
    "description": "A focused learning path for mastering Design System, with concepts, tools, projects, and next steps.",
    "topicCount": 124,
    "topics": [
      {
        "id": "ab-tests--experiments@ILRDAnpfGHCZq-FBlbfDO",
        "title": "A/B Tests and Experiments",
        "slug": "ab-tests--experiments",
        "summary": "Understand how the team implements A/B tests and experiments on different screens and if the new design system should accommodate any necessary requirements.",
        "sourcePath": "developer-roadmap/roadmaps/design-system/content/ab-tests--experiments@ILRDAnpfGHCZq-FBlbfDO.md"
      },
      {
        "id": "accessibility-testing@yhP8EhyCWWRBLkYPyOFeg",
        "title": "Accessibility Testing",
        "slug": "accessibility-testing",
        "summary": "Design systems should cover accessibility as much as possible. Making this automatic reduces the risk of inaccessible components or user flows in the product.",
        "sourcePath": "developer-roadmap/roadmaps/design-system/content/accessibility-testing@yhP8EhyCWWRBLkYPyOFeg.md"
      },
      {
        "id": "accessibility@DhrnZwQODG0P7D-27_3ec",
        "title": "Accessibility",
        "slug": "accessibility",
        "summary": "For icons that convey a meaning or serve a function, add the necessary support for screen readers. You can skip this for decorative icons.",
        "sourcePath": "developer-roadmap/roadmaps/design-system/content/accessibility@DhrnZwQODG0P7D-27_3ec.md"
      },
      {
        "id": "accessibility@aLtOGjNFxaRzg0PI-ed99",
        "title": "Accessibility",
        "slug": "accessibility",
        "summary": "Guidelines for how you approach accessibility and how you leverage colour, hierarchy and assistive technologies to help your users.",
        "sourcePath": "developer-roadmap/roadmaps/design-system/content/accessibility@aLtOGjNFxaRzg0PI-ed99.md"
      },
      {
        "id": "accessibility@fW0cEy2SB0HDbiF7QA7Ev",
        "title": "Accessibility",
        "slug": "accessibility",
        "summary": "Make sure to have accessible pairings between the main colours in your palette. More importantly, make sure that your background and text colours have at least an AA standard contrast ratio between them.",
        "sourcePath": "developer-roadmap/roadmaps/design-system/content/accessibility@fW0cEy2SB0HDbiF7QA7Ev.md"
      },
      {
        "id": "avatar@_dIMuXWI73ogboGjnLIpT",
        "title": "Avatar",
        "slug": "avatar",
        "summary": "Avatars represent users or entities in interfaces. They should support multiple shapes (circular, square), various sizes, handle missing images with initials or default icons, include status indicators, maintain image qu",
        "sourcePath": "developer-roadmap/roadmaps/design-system/content/avatar@_dIMuXWI73ogboGjnLIpT.md"
      },
      {
        "id": "avatar@h3TZY1yBkzLYUK6W7K7xs",
        "title": "Avatar",
        "slug": "avatar",
        "summary": "Avatars are used to show a thumbnail of a user photo or a visual representation of any other type of content.",
        "sourcePath": "developer-roadmap/roadmaps/design-system/content/avatar@h3TZY1yBkzLYUK6W7K7xs.md"
      },
      {
        "id": "badge@LNsXQI8sE_5kzSD_iMLJA",
        "title": "Badge",
        "slug": "badge",
        "summary": "Badges are elements that represent the status of an object or user input value.",
        "sourcePath": "developer-roadmap/roadmaps/design-system/content/badge@LNsXQI8sE_5kzSD_iMLJA.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/design-system"
  },
  {
    "slug": "software-design-architecture",
    "title": "Design and Architecture",
    "category": "skill",
    "description": "A focused learning path for mastering Design and Architecture, with concepts, tools, projects, and next steps.",
    "topicCount": 94,
    "topics": [
      {
        "id": "abstract-classes@RMkEE7c0jdVFqZ4fmjL6Y",
        "title": "Abstract Classes",
        "slug": "abstract-classes",
        "summary": "An abstract class is a class in object-oriented programming (OOP) that cannot be instantiated. Instead, it serves as a template or blueprint for other classes to inherit from. An abstract class can contain both abstract ",
        "sourcePath": "developer-roadmap/roadmaps/software-design-architecture/content/abstract-classes@RMkEE7c0jdVFqZ4fmjL6Y.md"
      },
      {
        "id": "abstraction@VA8FMrhF4non9x-J3urY8",
        "title": "Abstraction",
        "slug": "abstraction",
        "summary": "Abstraction is a concept in object-oriented programming (OOP) that refers to the process of hiding the implementation details of an object and exposing only its essential features. It enables the use of objects without t",
        "sourcePath": "developer-roadmap/roadmaps/software-design-architecture/content/abstraction@VA8FMrhF4non9x-J3urY8.md"
      },
      {
        "id": "anemic-models@nVaoI4IDPVEsdtFcjGNRw",
        "title": "Anemic Models",
        "slug": "anemic-models",
        "summary": "An Anemic model, also known as an anemic domain model, is a type of domain model in which the domain objects only contain data (attributes) and lack behavior. An anemic model often results in the use of data-transfer obj",
        "sourcePath": "developer-roadmap/roadmaps/software-design-architecture/content/anemic-models@nVaoI4IDPVEsdtFcjGNRw.md"
      },
      {
        "id": "architectural-patterns@gJYff_qD6XS3dg3I-jJFK",
        "title": "Architectural Patterns",
        "slug": "architectural-patterns",
        "summary": "Architectural patterns are high-level structural templates that shape the overall organization of a system, such as layered architecture, microservices, event-driven, and serverless. They define how major components comm",
        "sourcePath": "developer-roadmap/roadmaps/software-design-architecture/content/architectural-patterns@gJYff_qD6XS3dg3I-jJFK.md"
      },
      {
        "id": "architectural-patterns@jq916t7svaMw5sFOcqZSi",
        "title": "Architectural Patterns",
        "slug": "architectural-patterns",
        "summary": "Architectural patterns are a set of solutions that have been proven to work well for specific types of software systems. They provide a common vocabulary and set of best practices for designing and building software syst",
        "sourcePath": "developer-roadmap/roadmaps/software-design-architecture/content/architectural-patterns@jq916t7svaMw5sFOcqZSi.md"
      },
      {
        "id": "architectural-principles@XBCxWdpvQyK2iIG2eEA1K",
        "title": "Architectural Principles",
        "slug": "architectural-principles",
        "summary": "Architectural principles refer to a set of guidelines or rules that are used to guide the design and development of a software architecture. These principles are intended to ensure that the resulting architecture is main",
        "sourcePath": "developer-roadmap/roadmaps/software-design-architecture/content/architectural-principles@XBCxWdpvQyK2iIG2eEA1K.md"
      },
      {
        "id": "architectural-principles@dBq7ni-of5v1kxpdmh227",
        "title": "Architectural Principles",
        "slug": "architectural-principles",
        "summary": "Architectural principles are fundamental rules that guide design decisions across a system, such as loose coupling, high cohesion, separation of concerns, and scalability. They are the \"why\" behind a structure, helping t",
        "sourcePath": "developer-roadmap/roadmaps/software-design-architecture/content/architectural-principles@dBq7ni-of5v1kxpdmh227.md"
      },
      {
        "id": "architectural-styles@37xWxG2D9lVuDsHUgLfzP",
        "title": "Architectural Styles",
        "slug": "architectural-styles",
        "summary": "Architectural styles are sets of principles and constraints that define the characteristics of a software system. They provide a vocabulary and a framework for describing common system properties such as structure, behav",
        "sourcePath": "developer-roadmap/roadmaps/software-design-architecture/content/architectural-styles@37xWxG2D9lVuDsHUgLfzP.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/software-design-architecture"
  },
  {
    "slug": "devsecops",
    "title": "DevSecOps",
    "category": "role",
    "description": "A practical path for becoming a stronger DevSecOps practitioner, from fundamentals to production-ready work.",
    "topicCount": 94,
    "topics": [
      {
        "id": "acls@lLWQhvzXn3EpeCf9Mhgyj",
        "title": "Access Control Lists (ACLs)",
        "slug": "acls",
        "summary": "Access Control Lists (ACLs) are sets of rules that determine whether network traffic is allowed or denied to pass through a network interface. They act as a security filter, examining packets based on source and destinat",
        "sourcePath": "developer-roadmap/roadmaps/devsecops/content/acls@lLWQhvzXn3EpeCf9Mhgyj.md"
      },
      {
        "id": "alert-types@-j1PH9_z-Eq3jxX6e8VmQ",
        "title": "Alert Types",
        "slug": "alert-types",
        "summary": "Alert types are the different categories or classifications of notifications generated by monitoring systems when specific events or conditions occur. These alerts signal potential issues, anomalies, or security threats ",
        "sourcePath": "developer-roadmap/roadmaps/devsecops/content/alert-types@-j1PH9_z-Eq3jxX6e8VmQ.md"
      },
      {
        "id": "asymmetric@hz0WFG5ksaBFMpq7ypLgF",
        "title": "Asymmetric Encryption",
        "slug": "asymmetric",
        "summary": "Asymmetric encryption, also known as public-key cryptography, uses a pair of keys: a public key for encryption and a private key for decryption. The public key can be freely distributed, allowing anyone to encrypt data i",
        "sourcePath": "developer-roadmap/roadmaps/devsecops/content/asymmetric@hz0WFG5ksaBFMpq7ypLgF.md"
      },
      {
        "id": "attack-surface-mapping@JztcgG94qZ5trdhfDcRa6",
        "title": "Attack Surface Mapping",
        "slug": "attack-surface-mapping",
        "summary": "Attack surface mapping is the process of identifying and documenting all the potential entry points or vulnerabilities that an attacker could exploit to gain unauthorized access to a system or application. This involves ",
        "sourcePath": "developer-roadmap/roadmaps/devsecops/content/attack-surface-mapping@JztcgG94qZ5trdhfDcRa6.md"
      },
      {
        "id": "audit--compliance-mapping@04_UcLELHkqjBCwliCw7H",
        "title": "Audit & Compliance Mapping",
        "slug": "audit--compliance-mapping",
        "summary": "Audit & Compliance Mapping involves aligning an organization's security controls and practices with relevant regulatory requirements, industry standards, and internal policies. This process identifies which controls sati",
        "sourcePath": "developer-roadmap/roadmaps/devsecops/content/audit--compliance-mapping@04_UcLELHkqjBCwliCw7H.md"
      },
      {
        "id": "authentication@iiOWJ7KXyHp_ovVWNmDoc",
        "title": "Authentication",
        "slug": "authentication",
        "summary": "Authentication is the process of verifying the identity of a user, device, or application attempting to access a system or resource. It confirms that the entity is who or what it claims to be, typically by requiring them",
        "sourcePath": "developer-roadmap/roadmaps/devsecops/content/authentication@iiOWJ7KXyHp_ovVWNmDoc.md"
      },
      {
        "id": "authorization@DYmh1MkmAuXUJOFqnFzWc",
        "title": "Authorization",
        "slug": "authorization",
        "summary": "Authorization is the process of determining what a user or system is allowed to access or do. It verifies if a user, once authenticated, has the necessary permissions to perform a specific action on a particular resource",
        "sourcePath": "developer-roadmap/roadmaps/devsecops/content/authorization@DYmh1MkmAuXUJOFqnFzWc.md"
      },
      {
        "id": "automated-patching@HahTEhITEAGaoys1psZqV",
        "title": "Automated Patching",
        "slug": "automated-patching",
        "summary": "Automated patching is the process of automatically applying software updates and security fixes to systems and applications. This involves using tools and scripts to identify missing patches, download them from a central",
        "sourcePath": "developer-roadmap/roadmaps/devsecops/content/automated-patching@HahTEhITEAGaoys1psZqV.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/devsecops"
  },
  {
    "slug": "devops-beginner",
    "title": "Devops Beginner",
    "category": "skill",
    "description": "A focused learning path for mastering Devops Beginner, with concepts, tools, projects, and next steps.",
    "topicCount": 13,
    "topics": [
      {
        "id": "ansible@h9vVPOmdUSeEGVQQaSTH5",
        "title": "Ansible",
        "slug": "ansible",
        "summary": "Ansible is an open-source automation tool used for configuration management, application deployment, and task automation. It simplifies the process of managing and orchestrating infrastructure by using a declarative lang",
        "sourcePath": "developer-roadmap/roadmaps/devops-beginner/content/ansible@h9vVPOmdUSeEGVQQaSTH5.md"
      },
      {
        "id": "aws@1ieK6B_oqW8qOC6bdmiJe",
        "title": "AWS",
        "slug": "aws",
        "summary": "Amazon Web Services has been the market-leading cloud computing platform since 2011, ahead of Azure and Google Cloud. AWS offers over 200 services with data centers located all over the globe. AWS is an online platform t",
        "sourcePath": "developer-roadmap/roadmaps/devops-beginner/content/aws@1ieK6B_oqW8qOC6bdmiJe.md"
      },
      {
        "id": "docker@P0acFNZ413MSKElHqCxr3",
        "title": "Docker",
        "slug": "docker",
        "summary": "Docker is an open-source platform that automates the deployment, scaling, and management of applications using containerization technology. It enables developers to package applications with all their dependencies into s",
        "sourcePath": "developer-roadmap/roadmaps/devops-beginner/content/docker@P0acFNZ413MSKElHqCxr3.md"
      },
      {
        "id": "git@uyDm1SpOQdpHjq9zBAdck",
        "title": "Git",
        "slug": "git",
        "summary": "Git is a distributed version control system designed to track changes in source code during software development. It allows multiple developers to work on the same project simultaneously, maintaining a complete history o",
        "sourcePath": "developer-roadmap/roadmaps/devops-beginner/content/git@uyDm1SpOQdpHjq9zBAdck.md"
      },
      {
        "id": "github-actions@JnWVCS1HbAyfCJzGt-WOH",
        "title": "GitHub Actions",
        "slug": "github-actions",
        "summary": "GitHub Actions is GitHub’s built-in automation platform that lets you run workflows directly from your repository, such as building, testing, and deploying code, triggered by events like pushes, pull requests, or schedul",
        "sourcePath": "developer-roadmap/roadmaps/devops-beginner/content/github-actions@JnWVCS1HbAyfCJzGt-WOH.md"
      },
      {
        "id": "github@ot9I_IHdnq2yAMffrSrbN",
        "title": "GitHub",
        "slug": "github",
        "summary": "GitHub is a web-based platform built on top of Git that provides version control, collaboration tools, and project management features for software development. It enables developers to host Git repositories, collaborate",
        "sourcePath": "developer-roadmap/roadmaps/devops-beginner/content/github@ot9I_IHdnq2yAMffrSrbN.md"
      },
      {
        "id": "go@npnMwSDEK2aLGgnuZZ4dO",
        "title": "Go",
        "slug": "go",
        "summary": "Go (Golang) is Google's statically typed, compiled language combining efficiency with ease of use. Features built-in concurrency via goroutines and channels, simple syntax, fast compilation, and a comprehensive standard ",
        "sourcePath": "developer-roadmap/roadmaps/devops-beginner/content/go@npnMwSDEK2aLGgnuZZ4dO.md"
      },
      {
        "id": "networking--protocols@w5d24Sf8GDkLDLGUPxzS9",
        "title": "Networking Protocols",
        "slug": "networking--protocols",
        "summary": "Networking protocols are standardized rules and procedures that govern how data is transmitted, received, and interpreted across computer networks. They define the format, timing, sequencing, and error control in data co",
        "sourcePath": "developer-roadmap/roadmaps/devops-beginner/content/networking--protocols@w5d24Sf8GDkLDLGUPxzS9.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/devops-beginner"
  },
  {
    "slug": "devrel",
    "title": "Devrel",
    "category": "role",
    "description": "A practical path for becoming a stronger Devrel practitioner, from fundamentals to production-ready work.",
    "topicCount": 142,
    "topics": [
      {
        "id": "active-listening@UdUDngq425NYSvIuOd7St",
        "title": "Active Listening",
        "slug": "active-listening",
        "summary": "Active listening in developer relations is about genuinely engaging with the developer community to understand their needs, challenges, and feedback. It involves more than just hearing what is said; it requires attention",
        "sourcePath": "developer-roadmap/roadmaps/devrel/content/active-listening@UdUDngq425NYSvIuOd7St.md"
      },
      {
        "id": "advocacy@7MCmY1bABGPfmzjErADvg",
        "title": "Advocacy",
        "slug": "advocacy",
        "summary": "Developer Advocacy is the practice of representing and supporting the needs and interests of developers both within a company and in the broader developer community. Developer Advocates act as liaisons between the compan",
        "sourcePath": "developer-roadmap/roadmaps/devrel/content/advocacy@7MCmY1bABGPfmzjErADvg.md"
      },
      {
        "id": "analytics-and-optimization@lG1FH7Q-YX5pG-7mMtbSR",
        "title": "Analytics and Optimization",
        "slug": "analytics-and-optimization",
        "summary": "When engaging with developer communities on social media, it's important to monitor your analytics in order to maximise the potential of your content. Platforms like X provide great analytics that help you keep an eye on",
        "sourcePath": "developer-roadmap/roadmaps/devrel/content/analytics-and-optimization@lG1FH7Q-YX5pG-7mMtbSR.md"
      },
      {
        "id": "animations--graphics@D7_iNPEKxFv0gw-fsNNrZ",
        "title": "Animations & Graphics",
        "slug": "animations--graphics",
        "summary": "Animations and graphics can be a great addition to your live streaming setup, especially if they're related to the brand that you're representing. Be aware though that excessive animations and graphics can take its toll ",
        "sourcePath": "developer-roadmap/roadmaps/devrel/content/animations--graphics@D7_iNPEKxFv0gw-fsNNrZ.md"
      },
      {
        "id": "animations--graphics@OUWVqJImrmsZpAtRrUYNH",
        "title": "Animations & Graphics",
        "slug": "animations--graphics",
        "summary": "Animations and graphics are used in both video production and live streaming to illustrate concepts that are difficult to convey through code or speech alone. Architecture diagrams, data flow animations, and branded lowe",
        "sourcePath": "developer-roadmap/roadmaps/devrel/content/animations--graphics@OUWVqJImrmsZpAtRrUYNH.md"
      },
      {
        "id": "anticipate-questions@jyScVS-sYMcZcH3hOwbMK",
        "title": "Anticipate Questions",
        "slug": "anticipate-questions",
        "summary": "When giving talks, especially at developer conferences or events, its important to anticipate the audience asking questions at the end of your talk. Being prepared to handle common questions related to your topic can hel",
        "sourcePath": "developer-roadmap/roadmaps/devrel/content/anticipate-questions@jyScVS-sYMcZcH3hOwbMK.md"
      },
      {
        "id": "api-references@7IJO_jDpZUdlr_n5rBJ6O",
        "title": "API References",
        "slug": "api-references",
        "summary": "Adding API References to your products documentation is a key component and the most common reason for developers using documentation. When creating API documentation, ensure you add examples for the most common language",
        "sourcePath": "developer-roadmap/roadmaps/devrel/content/api-references@7IJO_jDpZUdlr_n5rBJ6O.md"
      },
      {
        "id": "apis--sdks@sUEZHmKxtjO9gXKJoOdbF",
        "title": "APIs & SDKs",
        "slug": "apis--sdks",
        "summary": "APIs and SDKs are the primary technical surfaces that DevRel teams support and promote. Understanding how they work, how they are designed, and how they are documented is fundamental to the role. DevRel professionals oft",
        "sourcePath": "developer-roadmap/roadmaps/devrel/content/apis--sdks@sUEZHmKxtjO9gXKJoOdbF.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/devrel"
  },
  {
    "slug": "django",
    "title": "Django",
    "category": "skill",
    "description": "A focused learning path for mastering Django, with concepts, tools, projects, and next steps.",
    "topicCount": 112,
    "topics": [
      {
        "id": "admin-customization@KHoau3Pz7o951L8Ivryk0",
        "title": "Admin Customization",
        "slug": "admin-customization",
        "summary": "Admin customization in Django refers to modifying the default appearance and functionality of the Django admin interface. This involves tailoring the admin site to better suit the specific needs of a project, such as cha",
        "sourcePath": "developer-roadmap/roadmaps/django/content/admin-customization@KHoau3Pz7o951L8Ivryk0.md"
      },
      {
        "id": "adminpy@tffzsnhXGpN8-CPLgmdxn",
        "title": "Django's admin.py",
        "slug": "adminpy",
        "summary": "`admin.py` is a Python file within a Django app that's responsible for configuring how your models are displayed and managed in Django's automatically generated admin interface. It allows you to register your models, cus",
        "sourcePath": "developer-roadmap/roadmaps/django/content/adminpy@tffzsnhXGpN8-CPLgmdxn.md"
      },
      {
        "id": "aggregations@9PRY8NUilH2xITVyhpQSy",
        "title": "Aggregations",
        "slug": "aggregations",
        "summary": "Aggregations in Django allow you to summarize data from multiple objects in your database. They compute a single summary value (like average, sum, or count) for a group of objects. Unlike annotations, which add a field t",
        "sourcePath": "developer-roadmap/roadmaps/django/content/aggregations@9PRY8NUilH2xITVyhpQSy.md"
      },
      {
        "id": "asynchronous-django@8AuyffbXskd8jltqyJVer",
        "title": "Asynchronous Django",
        "slug": "asynchronous-django",
        "summary": "Asynchronous programming allows a program to execute multiple tasks seemingly at the same time without waiting for each task to complete before starting the next. Instead of blocking and waiting, the program can switch b",
        "sourcePath": "developer-roadmap/roadmaps/django/content/asynchronous-django@8AuyffbXskd8jltqyJVer.md"
      },
      {
        "id": "authentication@k2P3gilbLJ7tjbLhBym_m",
        "title": "Authentication",
        "slug": "authentication",
        "summary": "Authentication is the process of verifying the identity of a user, device, or other entity attempting to access a system or resource. It confirms that someone or something is who or what they claim to be, typically by ch",
        "sourcePath": "developer-roadmap/roadmaps/django/content/authentication@k2P3gilbLJ7tjbLhBym_m.md"
      },
      {
        "id": "authorization@8-LeguN1r6pLVGvBbwzPZ",
        "title": "Authorization",
        "slug": "authorization",
        "summary": "Authorization is the process of determining whether a user has permission to access a specific resource or perform a particular action. It focuses on verifying what an authenticated user is allowed to do within a system,",
        "sourcePath": "developer-roadmap/roadmaps/django/content/authorization@8-LeguN1r6pLVGvBbwzPZ.md"
      },
      {
        "id": "background-tasks@x19j7d1jd_uFhy85w71i0",
        "title": "Background Tasks",
        "slug": "background-tasks",
        "summary": "Background tasks in Django are processes that run independently of the main web application, without blocking user requests. They are useful for handling time-consuming or resource-intensive operations like sending email",
        "sourcePath": "developer-roadmap/roadmaps/django/content/background-tasks@x19j7d1jd_uFhy85w71i0.md"
      },
      {
        "id": "built-in-user-model@SEEiAOOxLGUaZi3wYncUm",
        "title": "Built-in User Model",
        "slug": "built-in-user-model",
        "summary": "Django provides a default user model that handles common authentication tasks like user registration, login, and permission management. This model includes fields like username, password, email, first name, and last name",
        "sourcePath": "developer-roadmap/roadmaps/django/content/built-in-user-model@SEEiAOOxLGUaZi3wYncUm.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/django"
  },
  {
    "slug": "elasticsearch",
    "title": "Elasticsearch",
    "category": "skill",
    "description": "A focused learning path for mastering Elasticsearch, with concepts, tools, projects, and next steps.",
    "topicCount": 113,
    "topics": [
      {
        "id": "api-keys@6LJ8UCBA9jj4ENk1iLwC6",
        "title": "API Keys",
        "slug": "api-keys",
        "summary": "API keys in Elasticsearch provide a mechanism for authentication and authorization, allowing users or applications to securely access Elasticsearch APIs. They are a more granular alternative to using usernames and passwo",
        "sourcePath": "developer-roadmap/roadmaps/elasticsearch/content/api-keys@6LJ8UCBA9jj4ENk1iLwC6.md"
      },
      {
        "id": "authentication@b4PSjo2xVnkih7e9XlnQs",
        "title": "Authentication",
        "slug": "authentication",
        "summary": "Authentication is the process of verifying the identity of a user or system attempting to access a resource. It ensures that only authorized individuals or applications can gain entry by requiring them to prove who they ",
        "sourcePath": "developer-roadmap/roadmaps/elasticsearch/content/authentication@b4PSjo2xVnkih7e9XlnQs.md"
      },
      {
        "id": "autoscaling@pBQsOfU5JlCMTSdKVU0C2",
        "title": "Autoscaling",
        "slug": "autoscaling",
        "summary": "Autoscaling is the ability of a system to automatically adjust its resources (like compute, memory, or storage) based on the current demand. This means that the system can scale up (add more resources) when demand increa",
        "sourcePath": "developer-roadmap/roadmaps/elasticsearch/content/autoscaling@pBQsOfU5JlCMTSdKVU0C2.md"
      },
      {
        "id": "avg--sum--min--max@Avit-NGMkIA9JwJ7OUiNZ",
        "title": "Avg, Sum, Min, and Max Aggregations",
        "slug": "avg--sum--min--max",
        "summary": "These aggregations are fundamental tools for calculating statistical summaries of numerical data. They compute the average (Avg), total (Sum), smallest value (Min), and largest value (Max) respectively, across a set of d",
        "sourcePath": "developer-roadmap/roadmaps/elasticsearch/content/avg--sum--min--max@Avit-NGMkIA9JwJ7OUiNZ.md"
      },
      {
        "id": "bm25-algorithm@MqoJJv_aZCdCLHLpebrPA",
        "title": "BM25 Algorithm",
        "slug": "bm25-algorithm",
        "summary": "BM25 (Best Matching 25) is a ranking function used by search engines to estimate the relevance of documents to a given search query. It's a bag-of-words retrieval function that scores documents based on the query terms a",
        "sourcePath": "developer-roadmap/roadmaps/elasticsearch/content/bm25-algorithm@MqoJJv_aZCdCLHLpebrPA.md"
      },
      {
        "id": "boolean@8bNqL02B9VFraXaRDaxDq",
        "title": "Boolean Data Type",
        "slug": "boolean",
        "summary": "A boolean data type represents a logical value, which can be either true or false. It's used to store binary information, indicating whether a condition is met or not, or representing a simple yes/no state. This data typ",
        "sourcePath": "developer-roadmap/roadmaps/elasticsearch/content/boolean@8bNqL02B9VFraXaRDaxDq.md"
      },
      {
        "id": "boosting-queries@ebU65cyHH2TVGrQOHjILk",
        "title": "Boosting Queries",
        "slug": "boosting-queries",
        "summary": "Boosting queries in Elasticsearch allows you to influence the relevance score of documents based on specific criteria. It works by increasing or decreasing the score of documents that match certain query clauses, effecti",
        "sourcePath": "developer-roadmap/roadmaps/elasticsearch/content/boosting-queries@ebU65cyHH2TVGrQOHjILk.md"
      },
      {
        "id": "bulk-index@3VH_cfXDDZbYma-DL14Fe",
        "title": "Bulk Indexing",
        "slug": "bulk-index",
        "summary": "Bulk indexing in Elasticsearch is a way to send multiple indexing, updating, or deleting operations to the Elasticsearch cluster in a single request. Instead of sending each document individually, you batch them together",
        "sourcePath": "developer-roadmap/roadmaps/elasticsearch/content/bulk-index@3VH_cfXDDZbYma-DL14Fe.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/elasticsearch"
  },
  {
    "slug": "engineering-manager",
    "title": "Engineering Manager",
    "category": "role",
    "description": "A practical path for becoming a stronger Engineering Manager practitioner, from fundamentals to production-ready work.",
    "topicCount": 133,
    "topics": [
      {
        "id": "agile-methodologies@n9gvPHn4c1U-l6v-W9v6r",
        "title": "Agile methodologies",
        "slug": "agile-methodologies",
        "summary": "An Engineering Manager ensures smooth implementation of Agile methodologies within the team. The manager oversees sprint planning, backlog refinement, and retrospectives for consistent development flow. They have the key",
        "sourcePath": "developer-roadmap/roadmaps/engineering-manager/content/agile-methodologies@n9gvPHn4c1U-l6v-W9v6r.md"
      },
      {
        "id": "api-strategy@ukmMMWacekcejEiEKCLzh",
        "title": "API strategy",
        "slug": "api-strategy",
        "summary": "An Engineering Manager's ability to handle API strategies directly impacts the success of partner management. A key responsibility in this area is defining clear API requirements that align with partner needs and busines",
        "sourcePath": "developer-roadmap/roadmaps/engineering-manager/content/api-strategy@ukmMMWacekcejEiEKCLzh.md"
      },
      {
        "id": "architectural-decision-making@FtWNnOE3zObmjS-Og26M3",
        "title": "Architectural Decision-Making",
        "slug": "architectural-decision-making",
        "summary": "Architectural decision-making is a crucial responsibility for an Engineering Manager. These decisions can shape the future capabilities and operation of an engineering team. A manager should be capable of balancing curre",
        "sourcePath": "developer-roadmap/roadmaps/engineering-manager/content/architectural-decision-making@FtWNnOE3zObmjS-Og26M3.md"
      },
      {
        "id": "architecture-documentation@gHhNi32MSBmqk-oKOy-uj",
        "title": "Architecture documentation",
        "slug": "architecture-documentation",
        "summary": "Engineering managers pave the way to secure well-built architecture documents. These texts act as blueprints - they guide software development and offer comprehensive visibility into the system's structure. Therefore, ma",
        "sourcePath": "developer-roadmap/roadmaps/engineering-manager/content/architecture-documentation@gHhNi32MSBmqk-oKOy-uj.md"
      },
      {
        "id": "best-practices@4-MCXFOkMGcN369OPG-vw",
        "title": "Best Practices",
        "slug": "best-practices",
        "summary": "As an Engineering Manager, one key area you interact with is the best practices for documentation. This involves ensuring your team consistently maintains high-quality, easily readable, and efficiently structured documen",
        "sourcePath": "developer-roadmap/roadmaps/engineering-manager/content/best-practices@4-MCXFOkMGcN369OPG-vw.md"
      },
      {
        "id": "bias-recognition--mitigation@g9FvFKC715tZL2ZGlPl3N",
        "title": "Bias Recognition / Mitigation",
        "slug": "bias-recognition--mitigation",
        "summary": "An Engineering Manager shoulders the responsibility of shaping a team culture that empowers everyone equally. Recognizing and mitigating bias is both a pivotal and challenging part of this role. Ensuring that decisions a",
        "sourcePath": "developer-roadmap/roadmaps/engineering-manager/content/bias-recognition--mitigation@g9FvFKC715tZL2ZGlPl3N.md"
      },
      {
        "id": "blameless-post-mortems@fYkKo8D35AHd8agr3YrIP",
        "title": "Blameless Post-mortems",
        "slug": "blameless-post-mortems",
        "summary": "An Engineering Manager plays a key role in facilitating blameless post-mortems. They bring teams together after incidents to dissect what went wrong, ensuring the main goal is learning, not pointing fingers.",
        "sourcePath": "developer-roadmap/roadmaps/engineering-manager/content/blameless-post-mortems@fYkKo8D35AHd8agr3YrIP.md"
      },
      {
        "id": "board-presentations@5MM1ccB1pmQcd3Uyjmbr7",
        "title": "Board presentations",
        "slug": "board-presentations",
        "summary": "Engineering Managers handle board presentations as a means to communicate company's technical strategies and progress. Main responsibility includes providing a comprehensive yet easy-to-understand technical synopsis to t",
        "sourcePath": "developer-roadmap/roadmaps/engineering-manager/content/board-presentations@5MM1ccB1pmQcd3Uyjmbr7.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/engineering-manager"
  },
  {
    "slug": "flutter",
    "title": "Flutter",
    "category": "skill",
    "description": "A focused learning path for mastering Flutter, with concepts, tools, projects, and next steps.",
    "topicCount": 108,
    "topics": [
      {
        "id": "3-trees@24xYv3joKX1roqRGfBXmr",
        "title": "Trees",
        "slug": "3-trees",
        "summary": "A tree is a data structure that is used to represent the hierarchy of widgets in a Flutter app. The tree structure allows Flutter to manage the layout, styling, and behavior of the widgets in the app.",
        "sourcePath": "developer-roadmap/roadmaps/flutter/content/3-trees@24xYv3joKX1roqRGfBXmr.md"
      },
      {
        "id": "advanced-dart@bvojoCWJRSB6pdBFM1SbY",
        "title": "Advanced Dart",
        "slug": "advanced-dart",
        "summary": "Advanced Dart concepts crucial for Flutter development include generics for reusable code, `async`/`await` for clean asynchronous operations, mixins for multiple inheritance, abstract classes for base implementations, st",
        "sourcePath": "developer-roadmap/roadmaps/flutter/content/advanced-dart@bvojoCWJRSB6pdBFM1SbY.md"
      },
      {
        "id": "analytics@s5OVzjQp6k7rSphhv3hZE",
        "title": "Analytics",
        "slug": "analytics",
        "summary": "Analytics is a key aspect of understanding user behavior and measuring app performance for Flutter apps. There are a number of analytics tools available for Flutter apps, each with their own set of features and benefits.",
        "sourcePath": "developer-roadmap/roadmaps/flutter/content/analytics@s5OVzjQp6k7rSphhv3hZE.md"
      },
      {
        "id": "android-studio@QHPiMRg4IJXDErrEYamrJ",
        "title": "Android Studio",
        "slug": "android-studio",
        "summary": "Android Studio is an IDE that can be used for developing Flutter applications as well as Android apps. Flutter is a UI toolkit for building beautiful, natively compiled applications for mobile, web, and desktop from a si",
        "sourcePath": "developer-roadmap/roadmaps/flutter/content/android-studio@QHPiMRg4IJXDErrEYamrJ.md"
      },
      {
        "id": "animated-builder@M6iJ0VZWB8mreItlxvvqI",
        "title": "AnimatedBuilder",
        "slug": "animated-builder",
        "summary": "AnimatedBuilder is a widget in Flutter that allows you to build animations. It takes an `Animation` object and a builder function as input, and it returns a widget that is rebuilt whenever the animation changes. The buil",
        "sourcePath": "developer-roadmap/roadmaps/flutter/content/animated-builder@M6iJ0VZWB8mreItlxvvqI.md"
      },
      {
        "id": "animated-widget@yRY8MJuXxhDV6Hd-hTMRu",
        "title": "AnimatedWidget",
        "slug": "animated-widget",
        "summary": "AnimatedWidget is a Flutter widget that takes an `Animation` object as an argument and automatically updates whenever the animation changes. This can be useful when you want to create animations that are tightly coupled ",
        "sourcePath": "developer-roadmap/roadmaps/flutter/content/animated-widget@yRY8MJuXxhDV6Hd-hTMRu.md"
      },
      {
        "id": "animation-controller@eXaP_U-EzptBuOp5R0KK3",
        "title": "AnimationController",
        "slug": "animation-controller",
        "summary": "This class lets you perform tasks such as:",
        "sourcePath": "developer-roadmap/roadmaps/flutter/content/animation-controller@eXaP_U-EzptBuOp5R0KK3.md"
      },
      {
        "id": "animations@KLoL-055KShGrQ-NQosy8",
        "title": "Animations",
        "slug": "animations",
        "summary": "Flutter’s animation support makes it easy to implement a variety of animation types. Many widgets, especially Material widgets, come with the standard motion effects defined in their design spec, but it’s also possible t",
        "sourcePath": "developer-roadmap/roadmaps/flutter/content/animations@KLoL-055KShGrQ-NQosy8.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/flutter"
  },
  {
    "slug": "forward-deployed-engineer",
    "title": "Forward Deployed Engineer",
    "category": "role",
    "description": "A practical path for becoming a stronger Forward Deployed Engineer practitioner, from fundamentals to production-ready work.",
    "topicCount": 99,
    "topics": [
      {
        "id": "agent-architectures@RqfaQpg0ZK8-GMUPrU9EX",
        "title": "Agent Architectures",
        "slug": "agent-architectures",
        "summary": "Agent architectures define how an AI agent is structured: how it reasons, selects tools, manages memory, and decides when to stop. Common patterns include ReAct (reason + act), plan-and-execute, and tree-of-thought. Choo",
        "sourcePath": "developer-roadmap/roadmaps/forward-deployed-engineer/content/agent-architectures@RqfaQpg0ZK8-GMUPrU9EX.md"
      },
      {
        "id": "ai-agents@ZS84Fe33y6DCQYWPjSgZs",
        "title": "AI Agents",
        "slug": "ai-agents",
        "summary": "AI agents are systems where a language model is given tools and a goal, and takes a sequence of actions to complete a task rather than responding to a single prompt. In practice, most well-designed agents use one LLM cal",
        "sourcePath": "developer-roadmap/roadmaps/forward-deployed-engineer/content/ai-agents@ZS84Fe33y6DCQYWPjSgZs.md"
      },
      {
        "id": "ai-engineering-skills@tTTDizQfuACFUoAAsTCt1",
        "title": "AI Engineering Skills",
        "slug": "ai-engineering-skills",
        "summary": "AI Engineering",
        "sourcePath": "developer-roadmap/roadmaps/forward-deployed-engineer/content/ai-engineering-skills@tTTDizQfuACFUoAAsTCt1.md"
      },
      {
        "id": "ai-engineering@buA5I4rQkiDB_EDG-6kju",
        "title": "AI Engineering",
        "slug": "ai-engineering",
        "summary": "AI engineering involves building software systems that use machine learning models and large language models (LLMs) as components. This includes selecting models, integrating them via APIs, engineering prompts, managing ",
        "sourcePath": "developer-roadmap/roadmaps/forward-deployed-engineer/content/ai-engineering@buA5I4rQkiDB_EDG-6kju.md"
      },
      {
        "id": "ai-governance@NaNmI6f-LLdb-ITMaPD6w",
        "title": "AI Governance",
        "slug": "ai-governance",
        "summary": "AI governance refers to the policies, processes, and controls that ensure AI systems behave safely, fairly, and in compliance with regulations and organizational standards. This includes defining acceptable use, managing",
        "sourcePath": "developer-roadmap/roadmaps/forward-deployed-engineer/content/ai-governance@NaNmI6f-LLdb-ITMaPD6w.md"
      },
      {
        "id": "airflow@T_I3hVabg_-juEb7_Rz0v",
        "title": "Airflow",
        "slug": "airflow",
        "summary": "Apache Airflow is an open-source workflow orchestration platform for scheduling and monitoring data pipelines. Pipelines are defined as Directed Acyclic Graphs (DAGs) in Python, where each node is a task. Many enterprise",
        "sourcePath": "developer-roadmap/roadmaps/forward-deployed-engineer/content/airflow@T_I3hVabg_-juEb7_Rz0v.md"
      },
      {
        "id": "api-design@_nL7Wf1MG3mofKY9XwGDX",
        "title": "APIs Design",
        "slug": "api-design",
        "summary": "API design is the process of defining how services communicate with each other through well-structured interfaces. Good API design involves choosing the right protocol (REST, GraphQL, gRPC), defining clear resource model",
        "sourcePath": "developer-roadmap/roadmaps/forward-deployed-engineer/content/api-design@_nL7Wf1MG3mofKY9XwGDX.md"
      },
      {
        "id": "api-security@OkdMIcPrbRmTCvViMHL58",
        "title": "API Security",
        "slug": "api-security",
        "summary": "API security covers the practices and controls needed to protect APIs from unauthorized access and abuse. This includes authentication, authorization, rate limiting, input validation, and protection against common attack",
        "sourcePath": "developer-roadmap/roadmaps/forward-deployed-engineer/content/api-security@OkdMIcPrbRmTCvViMHL58.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/forward-deployed-engineer"
  },
  {
    "slug": "frontend-beginner",
    "title": "Frontend Beginner",
    "category": "skill",
    "description": "A focused learning path for mastering Frontend Beginner, with concepts, tools, projects, and next steps.",
    "topicCount": 9,
    "topics": [
      {
        "id": "css@ZhJhf1M2OphYbEmduFq-9",
        "title": "CSS",
        "slug": "css",
        "summary": "CSS, or Cascading Style Sheets, is a language used to describe the look and formatting of a document written in HTML. It controls things like the colors, fonts, layout, and overall visual presentation of a website, ensur",
        "sourcePath": "developer-roadmap/roadmaps/frontend-beginner/content/css@ZhJhf1M2OphYbEmduFq-9.md"
      },
      {
        "id": "git@R_I4SGYqLk5zze5I1zS_E",
        "title": "Git",
        "slug": "git",
        "summary": "Git is like a save button for your code, but way more powerful. It's a system that tracks changes you make to your files, so you can easily go back to earlier versions, compare different versions, and collaborate with ot",
        "sourcePath": "developer-roadmap/roadmaps/frontend-beginner/content/git@R_I4SGYqLk5zze5I1zS_E.md"
      },
      {
        "id": "github@qmTVMJDsEhNIkiwE_UTYu",
        "title": "GitHub",
        "slug": "github",
        "summary": "GitHub is a website and service that helps developers store and manage their code. Think of it like a cloud-based folder where you can keep all your project files. It also allows multiple people to work on the same proje",
        "sourcePath": "developer-roadmap/roadmaps/frontend-beginner/content/github@qmTVMJDsEhNIkiwE_UTYu.md"
      },
      {
        "id": "html@yWG2VUkaF5IJVVut6AiSy",
        "title": "HTML",
        "slug": "html",
        "summary": "HTML, or HyperText Markup Language, is the standard language for creating web pages. It uses tags to structure content like headings, paragraphs, images, and links, telling the web browser how to display the information.",
        "sourcePath": "developer-roadmap/roadmaps/frontend-beginner/content/html@yWG2VUkaF5IJVVut6AiSy.md"
      },
      {
        "id": "javascript@ODcfFEorkfJNupoQygM53",
        "title": "JavaScript",
        "slug": "javascript",
        "summary": "JavaScript is a programming language that makes websites interactive. It lets you add dynamic content, control multimedia, animate images, and pretty much everything else that makes a webpage more than just static text. ",
        "sourcePath": "developer-roadmap/roadmaps/frontend-beginner/content/javascript@ODcfFEorkfJNupoQygM53.md"
      },
      {
        "id": "npm@ib_FHinhrw8VuSet-xMF7",
        "title": "npm",
        "slug": "npm",
        "summary": "npm is like a personal assistant for your coding projects. It's a tool that helps you easily manage and share code packages (like pre-written bits of code that do specific things) in your projects. Think of it as an app ",
        "sourcePath": "developer-roadmap/roadmaps/frontend-beginner/content/npm@ib_FHinhrw8VuSet-xMF7.md"
      },
      {
        "id": "react@tG5v3O4lNIFc2uCnacPak",
        "title": "React",
        "slug": "react",
        "summary": "React is a JavaScript library for building user interfaces. It lets you break down complex UIs into smaller, reusable components. These components manage their own data and can be composed together to create larger appli",
        "sourcePath": "developer-roadmap/roadmaps/frontend-beginner/content/react@tG5v3O4lNIFc2uCnacPak.md"
      },
      {
        "id": "tailwind@eghnfG4p7i-EDWfp3CQXC",
        "title": "Tailwind CSS",
        "slug": "tailwind",
        "summary": "Tailwind CSS is a utility-first CSS framework. Instead of providing pre-designed components like buttons or navigation bars, it gives you a set of pre-defined CSS classes that you can use directly in your HTML to style y",
        "sourcePath": "developer-roadmap/roadmaps/frontend-beginner/content/tailwind@eghnfG4p7i-EDWfp3CQXC.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/frontend-beginner"
  },
  {
    "slug": "game-developer",
    "title": "Game Developer",
    "category": "role",
    "description": "A practical path for becoming a stronger Game Developer practitioner, from fundamentals to production-ready work.",
    "topicCount": 144,
    "topics": [
      {
        "id": "2d@Wq8siopWTD7sylNi0575X",
        "title": "2D",
        "slug": "2d",
        "summary": "2D Game Development involves creating games in a two-dimensional plane, utilizing flat graphics and typically making use of x and y coordinates. From classic arcade games of the ’80s and ’90s to the rich array of indie g",
        "sourcePath": "developer-roadmap/roadmaps/game-developer/content/2d@Wq8siopWTD7sylNi0575X.md"
      },
      {
        "id": "aabb@aTeYGd4JlPr5txNPyBezn",
        "title": "AABB",
        "slug": "aabb",
        "summary": "`AABB`, short for Axis-Aligned Bounding Box, is a commonly used form of bounding volume in game development. It is a box that directly aligns with the axes of the coordinate system and encapsulates a game object. The sid",
        "sourcePath": "developer-roadmap/roadmaps/game-developer/content/aabb@aTeYGd4JlPr5txNPyBezn.md"
      },
      {
        "id": "ab-pruning@KYCi4d475zZfNwlj6HZVD",
        "title": "AB Pruning",
        "slug": "ab-pruning",
        "summary": "`Alpha-Beta pruning` is an optimization technique for the minimax algorithm used in artificial intelligence (AI) programming, such as game development. It cuts off branches in the game tree that don't need to be searched",
        "sourcePath": "developer-roadmap/roadmaps/game-developer/content/ab-pruning@KYCi4d475zZfNwlj6HZVD.md"
      },
      {
        "id": "acceleration@ejZMnxZ0QrN-jBqo9Vrj8",
        "title": "Acceleration",
        "slug": "acceleration",
        "summary": "**Acceleration** refers to the rate of change in velocity per unit time. This physical concept is translated into game dynamics where it impacts the movement and speed of game characters or objects. For example, when a c",
        "sourcePath": "developer-roadmap/roadmaps/game-developer/content/acceleration@ejZMnxZ0QrN-jBqo9Vrj8.md"
      },
      {
        "id": "advanced-rendering@CDYszS1U4v95GozB_drbt",
        "title": "Advanced Rendering",
        "slug": "advanced-rendering",
        "summary": "**Advanced rendering** is a sophisticated technique used in game development that involves translating a 3D model or scene into a 2D image or animation. Advanced rendering techniques can involve various complex methods s",
        "sourcePath": "developer-roadmap/roadmaps/game-developer/content/advanced-rendering@CDYszS1U4v95GozB_drbt.md"
      },
      {
        "id": "affine-space@r5TcXQsU9s4NlAQIPvZ3U",
        "title": "Affine Space",
        "slug": "affine-space",
        "summary": "In the context of game mathematics, an **Affine Space** is a fundamental concept you should understand. It is a geometric structure with properties related to both geometry and algebra. The significant aspect of an affin",
        "sourcePath": "developer-roadmap/roadmaps/game-developer/content/affine-space@r5TcXQsU9s4NlAQIPvZ3U.md"
      },
      {
        "id": "affine-transformation@SkCreb6g4i-OFtJWhRYqO",
        "title": "Affine Transformation",
        "slug": "affine-transformation",
        "summary": "An **affine transformation**, in the context of game mathematics, is a function between affine spaces which preserves points, straight lines and planes. Also, sets of parallel lines remain parallel after an affine transf",
        "sourcePath": "developer-roadmap/roadmaps/game-developer/content/affine-transformation@SkCreb6g4i-OFtJWhRYqO.md"
      },
      {
        "id": "angular-velocity@Y7HYY5eq7OG42V9yQz0Q1",
        "title": "Angular Velocity",
        "slug": "angular-velocity",
        "summary": "Angular velocity, denoted by the symbol 'ω', is a measure of the rate of change of an angle per unit of time. In simpler terms, it corresponds to how quickly an object moves around a circle or rotates around a central po",
        "sourcePath": "developer-roadmap/roadmaps/game-developer/content/angular-velocity@Y7HYY5eq7OG42V9yQz0Q1.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/game-developer"
  },
  {
    "slug": "git-github-beginner",
    "title": "Git Github Beginner",
    "category": "skill",
    "description": "A focused learning path for mastering Git Github Beginner, with concepts, tools, projects, and next steps.",
    "topicCount": 5,
    "topics": [
      {
        "id": "basic-git-usage@PtU5Qwfzn3N1i3oRlCGoR",
        "title": "Basic Git Usage",
        "slug": "basic-git-usage",
        "summary": "You must master the fundamental commands you'll use every day to manage your project's code. These commands allow you to track changes, save snapshots of your work, and collaborate with others. They include initializing ",
        "sourcePath": "developer-roadmap/roadmaps/git-github-beginner/content/basic-git-usage@PtU5Qwfzn3N1i3oRlCGoR.md"
      },
      {
        "id": "collaboration@bXfCUG3h1TIFPgD4WUDph",
        "title": "Collaboration",
        "slug": "collaboration",
        "summary": "Collaboration in Git and GitHub refers to the process of multiple people working together on the same project, managing changes, and integrating their contributions seamlessly.  It involves using Git's branching and merg",
        "sourcePath": "developer-roadmap/roadmaps/git-github-beginner/content/collaboration@bXfCUG3h1TIFPgD4WUDph.md"
      },
      {
        "id": "learn-the-basics@HlUUGj3dOZ68t4gIjerXh",
        "title": "Learn the Basics",
        "slug": "learn-the-basics",
        "summary": "Git is like a save button for your code, allowing you to track changes, revert to previous versions, and collaborate with others without overwriting each other's work. GitHub, on the other hand, is a website and platform",
        "sourcePath": "developer-roadmap/roadmaps/git-github-beginner/content/learn-the-basics@HlUUGj3dOZ68t4gIjerXh.md"
      },
      {
        "id": "more-git@aZMVz6kc52vLGcZFD9Dgh",
        "title": "More Git",
        "slug": "more-git",
        "summary": "Beyond the basics of tracking changes and collaborating, Git offers a range of powerful features for managing complex projects. These features allow you to streamline your workflow, experiment safely with new ideas, and ",
        "sourcePath": "developer-roadmap/roadmaps/git-github-beginner/content/more-git@aZMVz6kc52vLGcZFD9Dgh.md"
      },
      {
        "id": "more-github@sti_TAgZvSpuFWtygAsKc",
        "title": "More GitHub",
        "slug": "more-github",
        "summary": "GitHub isn't just about storing code; it's a collaborative platform. It offers features beyond basic version control, such as project management tools like issue tracking, where you can report bugs and suggest new featur",
        "sourcePath": "developer-roadmap/roadmaps/git-github-beginner/content/more-github@sti_TAgZvSpuFWtygAsKc.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/git-github-beginner"
  },
  {
    "slug": "git-github",
    "title": "Git and GitHub",
    "category": "skill",
    "description": "A focused learning path for mastering Git and GitHub, with concepts, tools, projects, and next steps.",
    "topicCount": 155,
    "topics": [
      {
        "id": "--hard@V_joZNpQsS9G9PI-o-GmC",
        "title": "--hard",
        "slug": "--hard",
        "summary": "`git reset --hard` moves the branch pointer to a specified commit and resets both the staging area and working directory to match it exactly. Any changes in commits after that point, as well as any uncommitted work, get ",
        "sourcePath": "developer-roadmap/roadmaps/git-github/content/--hard@V_joZNpQsS9G9PI-o-GmC.md"
      },
      {
        "id": "--mixed@qis7Z5VRxMcOmbesQlegZ",
        "title": "--mixed",
        "slug": "--mixed",
        "summary": "When using mixed mode, the HEAD pointer is moved to the specified commit. However, files in your working directory remain as they were before the reset. The staging area (index) is updated to match the specified commit.",
        "sourcePath": "developer-roadmap/roadmaps/git-github/content/--mixed@qis7Z5VRxMcOmbesQlegZ.md"
      },
      {
        "id": "--soft@Uc7FyfAKpDFRGRNHwztFo",
        "title": "--soft",
        "slug": "--soft",
        "summary": "`git reset --soft` moves the branch pointer to a specified commit while leaving the staging area and working directory untouched. This means all changes from the undone commits remain staged, ready to be recommitted diff",
        "sourcePath": "developer-roadmap/roadmaps/git-github/content/--soft@Uc7FyfAKpDFRGRNHwztFo.md"
      },
      {
        "id": "adding--updating@x4bnsPVTiX2xOCSyrgWpF",
        "title": "Adding / Updating",
        "slug": "adding--updating",
        "summary": "To add a submodule to a repository, use `git submodule add https://github.com/user/submodule-repo.git`, which is the typical format for specifying the URL of the submodule repository. This creates a new folder for the su",
        "sourcePath": "developer-roadmap/roadmaps/git-github/content/adding--updating@x4bnsPVTiX2xOCSyrgWpF.md"
      },
      {
        "id": "automations@TNBz5755PhI6iKxTQTqcS",
        "title": "Automations",
        "slug": "automations",
        "summary": "To add automation to your GitHub project, use built-in workflows that can trigger actions such as setting fields on item changes or archiving items meeting specific criteria, and also configure automatic item addition fr",
        "sourcePath": "developer-roadmap/roadmaps/git-github/content/automations@TNBz5755PhI6iKxTQTqcS.md"
      },
      {
        "id": "between-branches@O-zoAWkDvyn7B8_TmY257",
        "title": "Between Branches",
        "slug": "between-branches",
        "summary": "When comparing the differences between two branches, such as a feature branch and its upstream parent branch, use `git diff <branch1>..<branch2>`. This command displays the changes made on the feature branch relative to ",
        "sourcePath": "developer-roadmap/roadmaps/git-github/content/between-branches@O-zoAWkDvyn7B8_TmY257.md"
      },
      {
        "id": "between-commits@Rwpeltygwzcf6hnuZNURE",
        "title": "Between Commits",
        "slug": "between-commits",
        "summary": "To compare two specific commits in your Git history, use git diff followed by the hashes of the commits. This will show you the changes made between those two points, including added, modified, and deleted lines.",
        "sourcePath": "developer-roadmap/roadmaps/git-github/content/between-commits@Rwpeltygwzcf6hnuZNURE.md"
      },
      {
        "id": "branch-naming@ks1Pip-RM-UWD6zuF2j4n",
        "title": "Branch Naming",
        "slug": "branch-naming",
        "summary": "Branch naming conventions give structure to how branches are labeled, often including a prefix like `feature/`, `bugfix/`, or `hotfix/` followed by a short description. Consistent naming makes it easy to identify a branc",
        "sourcePath": "developer-roadmap/roadmaps/git-github/content/branch-naming@ks1Pip-RM-UWD6zuF2j4n.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/git-github"
  },
  {
    "slug": "golang",
    "title": "Golang",
    "category": "skill",
    "description": "A focused learning path for mastering Golang, with concepts, tools, projects, and next steps.",
    "topicCount": 172,
    "topics": [
      {
        "id": "anonymous-functions@cEQ9NQX7ZkKLwz_hg9L_7",
        "title": "Anonymous Functions",
        "slug": "anonymous-functions",
        "summary": "Functions declared without names, also called function literals or lambdas. Can be assigned to variables, passed as arguments, or executed immediately. Useful for short operations, callbacks, goroutines, and closures. Ac",
        "sourcePath": "developer-roadmap/roadmaps/golang/content/anonymous-functions@cEQ9NQX7ZkKLwz_hg9L_7.md"
      },
      {
        "id": "array-to-slice-conversion@s1E4PQVVSlBeyNn7xBikW",
        "title": "Array to Slice Conversion",
        "slug": "array-to-slice-conversion",
        "summary": "Convert arrays to slices using expressions like `array[:]` or `array[start:end]`. Creates slice header pointing to array memory - no data copying. Modifications through slice affect original array. Efficient way to use a",
        "sourcePath": "developer-roadmap/roadmaps/golang/content/array-to-slice-conversion@s1E4PQVVSlBeyNn7xBikW.md"
      },
      {
        "id": "arrays@Eu8JV-_W-P_bCx_PglIW0",
        "title": "Arrays",
        "slug": "arrays",
        "summary": "Fixed-size sequences of same-type elements. Size is part of the type, so different sizes are different types. Declared with specific length, initialized to zero values. Value types (copied when assigned/passed). Slices a",
        "sourcePath": "developer-roadmap/roadmaps/golang/content/arrays@Eu8JV-_W-P_bCx_PglIW0.md"
      },
      {
        "id": "beego@p7yeYkbQKAjr2aA_eUno4",
        "title": "beego",
        "slug": "beego",
        "summary": "Beego is a full-stack web framework providing MVC architecture, ORM, session management, caching, and admin interface generation. Follows convention over configuration with extensive tooling for rapid development of ente",
        "sourcePath": "developer-roadmap/roadmaps/golang/content/beego@p7yeYkbQKAjr2aA_eUno4.md"
      },
      {
        "id": "benchmarks@t9xOuLBrAzEvv2-bOU2hF",
        "title": "Benchmarks",
        "slug": "benchmarks",
        "summary": "Benchmarks measure code performance by timing repeated executions. Functions start with `Benchmark` and use `*testing.B` parameter. Run with `go test -bench=.` to identify bottlenecks, compare implementations, and track ",
        "sourcePath": "developer-roadmap/roadmaps/golang/content/benchmarks@t9xOuLBrAzEvv2-bOU2hF.md"
      },
      {
        "id": "boolean@PRTou83_rD0u7p2elGG4s",
        "title": "Boolean",
        "slug": "boolean",
        "summary": "The `bool` type represents `true` or `false` values with default zero value of `false`. Essential for conditional logic, control flow, and binary states. Results from comparison (`==`, `!=`) and logical operations (`&&`,",
        "sourcePath": "developer-roadmap/roadmaps/golang/content/boolean@PRTou83_rD0u7p2elGG4s.md"
      },
      {
        "id": "break@IWdAJ1BXqJv8EMYvFWRaH",
        "title": "break",
        "slug": "break",
        "summary": "Immediately exits innermost loop or switch statement. In nested loops, only exits immediate loop unless used with labels to break outer loops. Essential for early termination when conditions are met. Helps write efficien",
        "sourcePath": "developer-roadmap/roadmaps/golang/content/break@IWdAJ1BXqJv8EMYvFWRaH.md"
      },
      {
        "id": "bubbletea@x9hDkF73rmvbewrgRgyOv",
        "title": "bubbletea",
        "slug": "bubbletea",
        "summary": "Bubble Tea is a framework for building terminal UIs based on The Elm Architecture. Uses model-update-view pattern for interactive CLI applications with keyboard input, styling, and component composition. Excellent for so",
        "sourcePath": "developer-roadmap/roadmaps/golang/content/bubbletea@x9hDkF73rmvbewrgRgyOv.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/golang"
  },
  {
    "slug": "graphql",
    "title": "Graphql",
    "category": "skill",
    "description": "A focused learning path for mastering Graphql, with concepts, tools, projects, and next steps.",
    "topicCount": 65,
    "topics": [
      {
        "id": "aliases@B77yLU4SuRChSjEbmYwc-",
        "title": "Aliases",
        "slug": "aliases",
        "summary": "Aliases in GraphQL rename fields in query responses, useful when requesting the same field multiple times with different arguments or when field names aren't suitable for client usage. They distinguish fields in response",
        "sourcePath": "developer-roadmap/roadmaps/graphql/content/aliases@B77yLU4SuRChSjEbmYwc-.md"
      },
      {
        "id": "apollo-client@D5O7ky5eXwm_Ys1IcFNaq",
        "title": "Apollo Client",
        "slug": "apollo-client",
        "summary": "Apollo Client is a popular GraphQL client library for JavaScript that provides data fetching, caching, and state management. It offers declarative data fetching with React hooks, intelligent caching, optimistic UI update",
        "sourcePath": "developer-roadmap/roadmaps/graphql/content/apollo-client@D5O7ky5eXwm_Ys1IcFNaq.md"
      },
      {
        "id": "apollo-server@o_VkyoN6DmUUkfl0u0cro",
        "title": "Apollo Server",
        "slug": "apollo-server",
        "summary": "Apollo Server is a popular open-source library for building GraphQL servers in JavaScript. It provides tools for parsing, validating, executing resolvers, and formatting responses with built-in features for authenticatio",
        "sourcePath": "developer-roadmap/roadmaps/graphql/content/apollo-server@o_VkyoN6DmUUkfl0u0cro.md"
      },
      {
        "id": "arguments@A54vi3Ao7fBHyTuqoH_it",
        "title": "Arguments",
        "slug": "arguments",
        "summary": "Arguments in GraphQL are values passed to fields in queries and mutations to filter or modify returned data. They're defined in the schema with a name, type, and optional default value, enabling dynamic data retrieval.",
        "sourcePath": "developer-roadmap/roadmaps/graphql/content/arguments@A54vi3Ao7fBHyTuqoH_it.md"
      },
      {
        "id": "arguments@hrpb108R8Gyu3hhzkMYzL",
        "title": "Arguments",
        "slug": "arguments",
        "summary": "Arguments in GraphQL are values passed to fields or directives to specify execution details like filtering, sorting, pagination, or configuration options. They're passed as key-value pairs, can be defined as variables, a",
        "sourcePath": "developer-roadmap/roadmaps/graphql/content/arguments@hrpb108R8Gyu3hhzkMYzL.md"
      },
      {
        "id": "asynchronous@tbDvQBtLRAcD-xYX9V7Va",
        "title": "Asynchronous",
        "slug": "asynchronous",
        "summary": "Asynchronous resolvers in GraphQL are functions that return promises instead of immediate values. They allow resolvers to wait for external operations like database queries or API calls to complete before returning resul",
        "sourcePath": "developer-roadmap/roadmaps/graphql/content/asynchronous@tbDvQBtLRAcD-xYX9V7Va.md"
      },
      {
        "id": "authorization@G50ZMlmP7Ru5LcFne5Rhu",
        "title": "Authorization",
        "slug": "authorization",
        "summary": "Authorization in GraphQL controls access to data and operations based on user permissions and roles. It can be implemented at the schema level, field level, or within resolvers, ensuring users only access data they're pe",
        "sourcePath": "developer-roadmap/roadmaps/graphql/content/authorization@G50ZMlmP7Ru5LcFne5Rhu.md"
      },
      {
        "id": "authorization@GzwPvLybxTJM96fUhQUOi",
        "title": "Authorization",
        "slug": "authorization",
        "summary": "Authorization in GraphQL refers to the process of controlling access to specific fields, types, or operations in a GraphQL schema based on user roles or permissions. It allows you to restrict access to certain data or fu",
        "sourcePath": "developer-roadmap/roadmaps/graphql/content/authorization@GzwPvLybxTJM96fUhQUOi.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/graphql"
  },
  {
    "slug": "html",
    "title": "Html",
    "category": "skill",
    "description": "A focused learning path for mastering Html, with concepts, tools, projects, and next steps.",
    "topicCount": 88,
    "topics": [
      {
        "id": "abbr@aeovzlUV4oWwZCMcAoRVC",
        "title": "Abbreviation Element",
        "slug": "abbr",
        "summary": "The `<abbr>` tag in HTML represents an abbreviation or acronym. It's useful for providing a full description of the abbreviated term when the user hovers over it, improving accessibility and clarity. The `title` attribut",
        "sourcePath": "developer-roadmap/roadmaps/html/content/abbr@aeovzlUV4oWwZCMcAoRVC.md"
      },
      {
        "id": "accessibility@YHoag7UR40OeIVUjfhQg_",
        "title": "Accessibility",
        "slug": "accessibility",
        "summary": "Accessibility in HTML refers to the practice of designing and developing web content that is usable by people with disabilities. This involves ensuring that websites and web applications are perceivable, operable, unders",
        "sourcePath": "developer-roadmap/roadmaps/html/content/accessibility@YHoag7UR40OeIVUjfhQg_.md"
      },
      {
        "id": "address@PGKWhfXEd3Iv0AIhL7y4_",
        "title": "Address Element",
        "slug": "address",
        "summary": "The `<address>` element in HTML represents contact information for the author or owner of a document or article. This can include physical addresses, email addresses, phone numbers, and social media links. It's typically",
        "sourcePath": "developer-roadmap/roadmaps/html/content/address@PGKWhfXEd3Iv0AIhL7y4_.md"
      },
      {
        "id": "article@99wo0cNHe0sU63_aDBrxY",
        "title": "Article Element",
        "slug": "article",
        "summary": "The `<article>` element in HTML represents a self-contained composition in a document, page, application, or site. It is intended to independently distributable or reusable, for example, in syndication. This could be a f",
        "sourcePath": "developer-roadmap/roadmaps/html/content/article@99wo0cNHe0sU63_aDBrxY.md"
      },
      {
        "id": "aside@VahoGEC6I3jX1916MsmUY",
        "title": "Aside Element",
        "slug": "aside",
        "summary": "The `<aside>` element in HTML represents a section of a page that is tangentially related to the main content. It's often used for sidebars, pull quotes, or other content that provides additional information or context b",
        "sourcePath": "developer-roadmap/roadmaps/html/content/aside@VahoGEC6I3jX1916MsmUY.md"
      },
      {
        "id": "audio@k8FZPxFcDPVnXBONWUhME",
        "title": "Audio",
        "slug": "audio",
        "summary": "Audio on the web involves incorporating sound files into HTML documents. This allows users to listen to music, podcasts, or other audio content directly within a webpage. The HTML `<audio>` element is used to embed audio",
        "sourcePath": "developer-roadmap/roadmaps/html/content/audio@k8FZPxFcDPVnXBONWUhME.md"
      },
      {
        "id": "b--strong@efddQv5AZqvGmIyuYuCr7",
        "title": "b / strong",
        "slug": "b--strong",
        "summary": "The `<b>` and `<strong>` tags in HTML are used to make text appear bold. While both achieve a similar visual effect, the `<b>` tag is primarily for stylistic purposes, indicating text that should be visually distinguishe",
        "sourcePath": "developer-roadmap/roadmaps/html/content/b--strong@efddQv5AZqvGmIyuYuCr7.md"
      },
      {
        "id": "basic-tags@MjGfRzhVZRxu545TbJ1AJ",
        "title": "Basic HTML Tags",
        "slug": "basic-tags",
        "summary": "HTML documents are structured using fundamental tags that define the document's content and structure. The `<!DOCTYPE html>` declaration informs the browser that the document is an HTML5 document. The `<html>` tag is the",
        "sourcePath": "developer-roadmap/roadmaps/html/content/basic-tags@MjGfRzhVZRxu545TbJ1AJ.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/html"
  },
  {
    "slug": "ios",
    "title": "Ios",
    "category": "role",
    "description": "A practical path for becoming a stronger Ios practitioner, from fundamentals to production-ready work.",
    "topicCount": 170,
    "topics": [
      {
        "id": "accessibility-inspector@h34LaYQ3JYN2AZPMDqpmO",
        "title": "Accessibility Inspector",
        "slug": "accessibility-inspector",
        "summary": "Accessibility Inspector is a tool in Xcode that audits UI elements for accessibility issues. It displays the accessibility properties of each element, runs automated audits to catch missing labels and low-contrast issues",
        "sourcePath": "developer-roadmap/roadmaps/ios/content/accessibility-inspector@h34LaYQ3JYN2AZPMDqpmO.md"
      },
      {
        "id": "accessibility@1DZYPqvgY6GtwMCS7N2y-",
        "title": "Accessibility",
        "slug": "accessibility",
        "summary": "With built-in accessibility features, accessibility APIs, and developer tools, Apple operating systems provide extraordinary opportunities to deliver high-quality experiences to everyone, including people with disabiliti",
        "sourcePath": "developer-roadmap/roadmaps/ios/content/accessibility@1DZYPqvgY6GtwMCS7N2y-.md"
      },
      {
        "id": "alamofire@nJeBisdKtN43ntkXnPCVF",
        "title": "Alamofire",
        "slug": "alamofire",
        "summary": "Alamofire is a Swift networking library built on top of URLSession that simplifies common networking tasks. It provides a clean, chainable API for making requests, handling authentication, and serializing responses. Alam",
        "sourcePath": "developer-roadmap/roadmaps/ios/content/alamofire@nJeBisdKtN43ntkXnPCVF.md"
      },
      {
        "id": "app-store-distribution@iZAXQKLe2LaIIifVFtFOL",
        "title": "App Store Distribution",
        "slug": "app-store-distribution",
        "summary": "Distributing an iOS app through the App Store requires a paid Apple Developer Program membership, building a release archive signed with a distribution certificate, and submitting it through App Store Connect. The app go",
        "sourcePath": "developer-roadmap/roadmaps/ios/content/app-store-distribution@iZAXQKLe2LaIIifVFtFOL.md"
      },
      {
        "id": "app-store-optimization-aso@jZpH-T2hW-XBdprVqemGi",
        "title": "App Store Optimization (ASO)",
        "slug": "app-store-optimization-aso",
        "summary": "App Store Optimization (ASO) is the process of improving an iOS app's visibility and conversion rate in the App Store. It involves optimizing the app name, subtitle, keywords, screenshots, and description to rank higher ",
        "sourcePath": "developer-roadmap/roadmaps/ios/content/app-store-optimization-aso@jZpH-T2hW-XBdprVqemGi.md"
      },
      {
        "id": "architectural-patterns@ajPGMwoaFb1UFWTtpi5kd",
        "title": "Architectural Patterns",
        "slug": "architectural-patterns",
        "summary": "iOS development architectural patterns are structured approaches to organizing code for better maintainability, testability, and scalability. Each pattern has its strengths, and the choice often depends on project size, ",
        "sourcePath": "developer-roadmap/roadmaps/ios/content/architectural-patterns@ajPGMwoaFb1UFWTtpi5kd.md"
      },
      {
        "id": "arkit@k3uHcF0CsyHr6PK95UwR1",
        "title": "ARKit",
        "slug": "arkit",
        "summary": "ARKit is Apple's augmented reality framework for iOS. It uses the device's camera and motion sensors to track the physical world and overlay digital content on top of it. ARKit provides features like horizontal and verti",
        "sourcePath": "developer-roadmap/roadmaps/ios/content/arkit@k3uHcF0CsyHr6PK95UwR1.md"
      },
      {
        "id": "async--await@ysaBCl_TtWqelirptQp7P",
        "title": "Async / Await",
        "slug": "async--await",
        "summary": "Async/await is Swift's built-in structured concurrency model, introduced in Swift 5.5. Async functions can be suspended at await points without blocking a thread, allowing other work to proceed in the meantime. This make",
        "sourcePath": "developer-roadmap/roadmaps/ios/content/async--await@ysaBCl_TtWqelirptQp7P.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/ios"
  },
  {
    "slug": "java",
    "title": "Java",
    "category": "skill",
    "description": "A focused learning path for mastering Java, with concepts, tools, projects, and next steps.",
    "topicCount": 86,
    "topics": [
      {
        "id": "abstraction@qdA6bK9ZkP8p0_NH_wMuj",
        "title": "Abstraction",
        "slug": "abstraction",
        "summary": "The abstract keyword in Java is used to declare a class or a method that cannot be instantiated directly or must be implemented by subclasses, respectively. It is a key part of Java's abstraction mechanism, allowing deve",
        "sourcePath": "developer-roadmap/roadmaps/java/content/abstraction@qdA6bK9ZkP8p0_NH_wMuj.md"
      },
      {
        "id": "access-specifiers@KYndNwfQcwRCf3zCXOwd_",
        "title": "Access Specifiers",
        "slug": "access-specifiers",
        "summary": "Access specifiers (or access modifiers) in Java are keywords that control the visibility or accessibility of classes, methods, constructors, and other members. They determine from where these members can be accessed. Jav",
        "sourcePath": "developer-roadmap/roadmaps/java/content/access-specifiers@KYndNwfQcwRCf3zCXOwd_.md"
      },
      {
        "id": "annotations@c--y6GcKj9am0CBdu_Hnt",
        "title": "Annotations",
        "slug": "annotations",
        "summary": "Annotations are a form of metadata that provide data about a program. They are used to provide supplemental information about the code, but they are not a part of the program itself. Annotations can be used by the compil",
        "sourcePath": "developer-roadmap/roadmaps/java/content/annotations@c--y6GcKj9am0CBdu_Hnt.md"
      },
      {
        "id": "array-vs-arraylist@a-EQiBUlSgdZba1mW36op",
        "title": "Array vs ArrayList",
        "slug": "array-vs-arraylist",
        "summary": "Arrays and ArrayLists are both ways to store collections of elements in Java. An array is a fixed-size, ordered sequence of elements of the same data type. Once you declare its size, you cannot change it. An ArrayList, o",
        "sourcePath": "developer-roadmap/roadmaps/java/content/array-vs-arraylist@a-EQiBUlSgdZba1mW36op.md"
      },
      {
        "id": "arrays@5khApwg1FZ-0qorsLyH-F",
        "title": "Arrays",
        "slug": "arrays",
        "summary": "Arrays are fundamental data structures used to store a collection of elements of the same data type in contiguous memory locations. They provide a way to organize and access multiple values using a single variable name a",
        "sourcePath": "developer-roadmap/roadmaps/java/content/arrays@5khApwg1FZ-0qorsLyH-F.md"
      },
      {
        "id": "attributes-and-methods@xTwJYcA6ldgaw3yGmbDEd",
        "title": "Attributes and Methods",
        "slug": "attributes-and-methods",
        "summary": "Attributes are variables that hold data about an object, defining its state or characteristics. Methods are functions that define the behavior of an object, allowing it to perform actions or operations. Together, attribu",
        "sourcePath": "developer-roadmap/roadmaps/java/content/attributes-and-methods@xTwJYcA6ldgaw3yGmbDEd.md"
      },
      {
        "id": "basic-syntax@OlbQNB6YXZjO1J7D0lZU1",
        "title": "Basic Syntax",
        "slug": "basic-syntax",
        "summary": "Understanding the basics is the key to a solid foundation. In this section, learn the basic terminologies, naming conventions, reserved keywords, expressions, statements, data structures, OOP, packages, etc.",
        "sourcePath": "developer-roadmap/roadmaps/java/content/basic-syntax@OlbQNB6YXZjO1J7D0lZU1.md"
      },
      {
        "id": "basics-of-oop@DZ4BX4NYeCQbjGSj56lng",
        "title": "Basics of OOP",
        "slug": "basics-of-oop",
        "summary": "Object-Oriented Programming (OOP) is a programming paradigm centered around \"objects,\" which contain data in the form of fields (attributes) and code in the form of procedures (methods). OOP focuses on creating reusable ",
        "sourcePath": "developer-roadmap/roadmaps/java/content/basics-of-oop@DZ4BX4NYeCQbjGSj56lng.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/java"
  },
  {
    "slug": "kotlin",
    "title": "Kotlin",
    "category": "skill",
    "description": "A focused learning path for mastering Kotlin, with concepts, tools, projects, and next steps.",
    "topicCount": 153,
    "topics": [
      {
        "id": "abstract-class@8jkUleKbxXSxPHbeFUTGK",
        "title": "Abstract Class",
        "slug": "abstract-class",
        "summary": "An abstract class in Kotlin is a class that cannot be instantiated directly. It's designed to be a blueprint for other classes. Abstract classes can contain both abstract members (methods and properties without implement",
        "sourcePath": "developer-roadmap/roadmaps/kotlin/content/abstract-class@8jkUleKbxXSxPHbeFUTGK.md"
      },
      {
        "id": "aggregate-operations@nRpmP5Nd2r4YKRNsmoscJ",
        "title": "Aggregate Operations",
        "slug": "aggregate-operations",
        "summary": "Aggregate operations in Kotlin collections transform a collection into a single result. These operations combine the elements of a collection using a specific function. Common examples include finding the sum, average, m",
        "sourcePath": "developer-roadmap/roadmaps/kotlin/content/aggregate-operations@nRpmP5Nd2r4YKRNsmoscJ.md"
      },
      {
        "id": "ai-development@RSufL2bzKXZhz9M98oGTA",
        "title": "AI Development",
        "slug": "ai-development",
        "summary": "Kotlin provides a modern and pragmatic foundation for building AI-powered applications. It can be used across platforms, integrates well with established AI frameworks, and supports common AI development patterns through",
        "sourcePath": "developer-roadmap/roadmaps/kotlin/content/ai-development@RSufL2bzKXZhz9M98oGTA.md"
      },
      {
        "id": "android-jetpack@3bzq_ZWCVoe3KiKJPTLGR",
        "title": "Android Jetpack",
        "slug": "android-jetpack",
        "summary": "Android Jetpack is a suite of libraries, tools, and architectural guidance designed to help developers build robust, testable, and maintainable Android applications more easily. It addresses common Android development ch",
        "sourcePath": "developer-roadmap/roadmaps/kotlin/content/android-jetpack@3bzq_ZWCVoe3KiKJPTLGR.md"
      },
      {
        "id": "android-sdk@xpALRb8KUT-i4Lj0EjI7o",
        "title": "Android SDK",
        "slug": "android-sdk",
        "summary": "The Android SDK (Software Development Kit) is a set of tools, libraries, documentation, and sample code provided by Google that allows developers to create applications for the Android operating system. It provides the n",
        "sourcePath": "developer-roadmap/roadmaps/kotlin/content/android-sdk@xpALRb8KUT-i4Lj0EjI7o.md"
      },
      {
        "id": "android-studio@SzGLbXgW6Z6UHPoTjI-pB",
        "title": "Android Studio",
        "slug": "android-studio",
        "summary": "Android Studio is the official Integrated Development Environment (IDE) for Android app development, and it fully supports Kotlin. It provides tools for coding, debugging, testing, and designing user interfaces for Andro",
        "sourcePath": "developer-roadmap/roadmaps/kotlin/content/android-studio@SzGLbXgW6Z6UHPoTjI-pB.md"
      },
      {
        "id": "android-studio@dBn3sAg2sey3zQNRwdMq2",
        "title": "Android Studio",
        "slug": "android-studio",
        "summary": "Android Studio is the official Integrated Development Environment (IDE) for Android app development, built on JetBrains' IntelliJ IDEA. It provides a comprehensive suite of tools for designing, developing, debugging, and",
        "sourcePath": "developer-roadmap/roadmaps/kotlin/content/android-studio@dBn3sAg2sey3zQNRwdMq2.md"
      },
      {
        "id": "anonymous-functions@7BYTt5_wILzkbYmQW1Xny",
        "title": "Anonymous Functions",
        "slug": "anonymous-functions",
        "summary": "Anonymous functions in Kotlin are functions without a name. They are defined using a lambda expression but with an explicit return type and the `return` keyword for returning values. They are useful when you need to defi",
        "sourcePath": "developer-roadmap/roadmaps/kotlin/content/anonymous-functions@7BYTt5_wILzkbYmQW1Xny.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/kotlin"
  },
  {
    "slug": "laravel",
    "title": "Laravel",
    "category": "skill",
    "description": "A focused learning path for mastering Laravel, with concepts, tools, projects, and next steps.",
    "topicCount": 104,
    "topics": [
      {
        "id": "app@U9EVG_fIFy57WWPwJSXv6",
        "title": "App Directory",
        "slug": "app",
        "summary": "The `app` directory in a Laravel project houses the core logic of your application. It contains the code that defines your application's behavior, including models, controllers, middleware, services, and other custom cla",
        "sourcePath": "developer-roadmap/roadmaps/laravel/content/app@U9EVG_fIFy57WWPwJSXv6.md"
      },
      {
        "id": "artisan@mz4QuqdC_EXKuX3KLX8_S",
        "title": "Artisan Console",
        "slug": "artisan",
        "summary": "Artisan is the command-line interface (CLI) included with Laravel. It provides a number of helpful commands that can assist you while building your application. These commands can automate repetitive tasks, generate boil",
        "sourcePath": "developer-roadmap/roadmaps/laravel/content/artisan@mz4QuqdC_EXKuX3KLX8_S.md"
      },
      {
        "id": "authentication@SZY9d1QisyChz-Jmu82pC",
        "title": "Authentication in Laravel",
        "slug": "authentication",
        "summary": "Authentication is the process of verifying the identity of a user. It involves confirming that a user is who they claim to be, typically by checking their credentials (like a username and password) against stored records",
        "sourcePath": "developer-roadmap/roadmaps/laravel/content/authentication@SZY9d1QisyChz-Jmu82pC.md"
      },
      {
        "id": "authorization@PvSwwdBaYY32Sv5qfe9aB",
        "title": "Authorization",
        "slug": "authorization",
        "summary": "Authorization is the process of determining whether a user has permission to access a specific resource or perform a particular action. It verifies if an authenticated user is allowed to do what they are attempting to do",
        "sourcePath": "developer-roadmap/roadmaps/laravel/content/authorization@PvSwwdBaYY32Sv5qfe9aB.md"
      },
      {
        "id": "basic-controllers@Xjt4YYR8zEzUfNY6D2JwU",
        "title": "Basic Controllers",
        "slug": "basic-controllers",
        "summary": "Controllers are fundamental building blocks in web applications that handle incoming requests and orchestrate the application's response. They act as intermediaries between the user interface (or API endpoint) and the ap",
        "sourcePath": "developer-roadmap/roadmaps/laravel/content/basic-controllers@Xjt4YYR8zEzUfNY6D2JwU.md"
      },
      {
        "id": "basic-routes@LgHiEGflKuzsBEOMSX4i4",
        "title": "Basic Routes",
        "slug": "basic-routes",
        "summary": "Routing in Laravel determines how your application responds to client requests. It essentially maps URLs (like `/about` or `/contact`) to specific functions or controllers within your application. When a user visits a pa",
        "sourcePath": "developer-roadmap/roadmaps/laravel/content/basic-routes@LgHiEGflKuzsBEOMSX4i4.md"
      },
      {
        "id": "blade--livewire@rUKVDwwjP3pXswi-rWIj2",
        "title": "Blade and Livewire Integration",
        "slug": "blade--livewire",
        "summary": "Blade is Laravel's templating engine, allowing developers to use simple syntax to create dynamic web pages. Livewire is a full-stack framework for Laravel that enables you to build dynamic interfaces using Laravel and PH",
        "sourcePath": "developer-roadmap/roadmaps/laravel/content/blade--livewire@rUKVDwwjP3pXswi-rWIj2.md"
      },
      {
        "id": "blade-directives@lG-7OBSjPCyxpYQsROA5C",
        "title": "Blade Directives",
        "slug": "blade-directives",
        "summary": "Blade directives are shortcuts to common PHP control structures, like `if` statements and loops, within Laravel's Blade templating engine. They provide a cleaner and more readable syntax for embedding PHP logic directly ",
        "sourcePath": "developer-roadmap/roadmaps/laravel/content/blade-directives@lG-7OBSjPCyxpYQsROA5C.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/laravel"
  },
  {
    "slug": "leetcode",
    "title": "Leetcode",
    "category": "skill",
    "description": "A focused learning path for mastering Leetcode, with concepts, tools, projects, and next steps.",
    "topicCount": 155,
    "topics": [
      {
        "id": "1-d-dynamic-programming@sRU06JyWqwCnRDYEAV53L",
        "title": "1-D Dynamic Programming",
        "slug": "1-d-dynamic-programming",
        "summary": "Dynamic programming is the technique of breaking a problem into overlapping subproblems, solving each once, and storing the result to avoid recomputation. In one-dimensional DP, each state depends only on a fixed number ",
        "sourcePath": "developer-roadmap/roadmaps/leetcode/content/1-d-dynamic-programming@sRU06JyWqwCnRDYEAV53L.md"
      },
      {
        "id": "2-d-dynamic-programming@sXyW3ZAURJUze8_g9PvwW",
        "title": "2-D Dynamic Programming",
        "slug": "2-d-dynamic-programming",
        "summary": "Two-dimensional DP extends the same ideas to problems where the state depends on two variables simultaneously, typically two indices into two sequences or two dimensions of a grid. The table is now a matrix, and each cel",
        "sourcePath": "developer-roadmap/roadmaps/leetcode/content/2-d-dynamic-programming@sXyW3ZAURJUze8_g9PvwW.md"
      },
      {
        "id": "3sum@yis4-_D0GREukouiRcCwC",
        "title": "3Sum",
        "slug": "3sum",
        "summary": "Given an array of integers, find all unique triplets that sum to zero. You sort the array first, then for each element use two pointers to find pairs that complete the triplet. The sort plus two pointers bring it from O(",
        "sourcePath": "developer-roadmap/roadmaps/leetcode/content/3sum@yis4-_D0GREukouiRcCwC.md"
      },
      {
        "id": "advanced-graphs@jNYQFvR3IafFXbAQHL4bF",
        "title": "Advanced Graphs",
        "slug": "advanced-graphs",
        "summary": "Advanced graph problems involve weighted edges, which require more sophisticated algorithms than simple BFS or DFS. Dijkstra's algorithm finds the shortest path in a weighted graph using a min-heap. Prim's and Kruskal's ",
        "sourcePath": "developer-roadmap/roadmaps/leetcode/content/advanced-graphs@jNYQFvR3IafFXbAQHL4bF.md"
      },
      {
        "id": "arrays--hashing@C4M0XfOtB9_Q8srAJU__A",
        "title": "Arrays & Hashing",
        "slug": "arrays--hashing",
        "summary": "Arrays and hash maps are the building blocks of almost every algorithm problem. Before learning any pattern, you need to be comfortable navigating an array and reaching for a hash map when you need fast lookups. Most pro",
        "sourcePath": "developer-roadmap/roadmaps/leetcode/content/arrays--hashing@C4M0XfOtB9_Q8srAJU__A.md"
      },
      {
        "id": "backtracking@gEZFGJPq0JFjpRwl3z3XK",
        "title": "Backtracking",
        "slug": "backtracking",
        "summary": "Backtracking is a systematic way to explore all possible solutions by making a choice, recursing, and undoing the choice when you backtrack. It is the right tool for problems that ask for all combinations, all permutatio",
        "sourcePath": "developer-roadmap/roadmaps/leetcode/content/backtracking@gEZFGJPq0JFjpRwl3z3XK.md"
      },
      {
        "id": "best-time-to-buy-and-sell@K7qTp-hRmxxVLYvr4ftr7",
        "title": "Best Time to Buy and Sell Stock",
        "slug": "best-time-to-buy-and-sell",
        "summary": "Given an array of daily stock prices, find the maximum profit from one buy and one sell. You track the minimum price seen so far and the best profit achievable at each step using a single pass. This is the simplest slidi",
        "sourcePath": "developer-roadmap/roadmaps/leetcode/content/best-time-to-buy-and-sell@K7qTp-hRmxxVLYvr4ftr7.md"
      },
      {
        "id": "binary-search@OkNQABVymkpxvHE7gVids",
        "title": "Binary Search",
        "slug": "binary-search",
        "summary": "Binary search is not just for finding an element in a sorted array. It is a general technique for eliminating half the search space at each step, and it applies whenever you can define a condition that splits possible an",
        "sourcePath": "developer-roadmap/roadmaps/leetcode/content/binary-search@OkNQABVymkpxvHE7gVids.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/leetcode"
  },
  {
    "slug": "linux",
    "title": "Linux",
    "category": "skill",
    "description": "A focused learning path for mastering Linux, with concepts, tools, projects, and next steps.",
    "topicCount": 102,
    "topics": [
      {
        "id": "adding-disks@4xBaZPk0eSsWG1vK3e2yW",
        "title": "Adding Disks",
        "slug": "adding-disks",
        "summary": "Adding disks in Linux involves partitioning, creating filesystems, and mounting. Use `lsblk` to list devices, `fdisk /dev/sdX` to create partitions, `mkfs.ext4 /dev/sdX1` to create filesystems, and `mount /dev/sdX1 /moun",
        "sourcePath": "developer-roadmap/roadmaps/linux/content/adding-disks@4xBaZPk0eSsWG1vK3e2yW.md"
      },
      {
        "id": "archiving-and-compressing@iD073xTmpzvQFfXwcwXcY",
        "title": "Archiving and Compressing",
        "slug": "archiving-and-compressing",
        "summary": "Archiving bundles multiple files into a single file, typically using `tar`, while compressing reduces that file's size using tools like `gzip` or `bzip2`. A common pattern combines both steps at once, such as `tar -czvf ",
        "sourcePath": "developer-roadmap/roadmaps/linux/content/archiving-and-compressing@iD073xTmpzvQFfXwcwXcY.md"
      },
      {
        "id": "authentication-logs@WwybfdKuP9ogCGpT7d3NU",
        "title": "Authentication Logs",
        "slug": "authentication-logs",
        "summary": "Authentication logs in Linux record all auth-related events like logins, password changes, and sudo commands. Located at `/var/log/auth.log` (Debian) or `/var/log/secure` (RHEL/CentOS), these logs help detect brute force",
        "sourcePath": "developer-roadmap/roadmaps/linux/content/authentication-logs@WwybfdKuP9ogCGpT7d3NU.md"
      },
      {
        "id": "available-memory--disk@tx0nh6cbBjVxwNlyrBNYm",
        "title": "Available Memory and Disk",
        "slug": "available-memory--disk",
        "summary": "Linux provides tools like `free`, `vmstat`, and `top` to monitor system memory usage and performance. The `free -h` command shows total, used, free, shared, buffer/cache, and available memory in human-readable format. Re",
        "sourcePath": "developer-roadmap/roadmaps/linux/content/available-memory--disk@tx0nh6cbBjVxwNlyrBNYm.md"
      },
      {
        "id": "awk@QTmECqpRVMjNgQU70uCF8",
        "title": "AWK",
        "slug": "awk",
        "summary": "AWK is a powerful text-processing language for Unix-like systems, named after its creators Aho, Weinberger, and Kernighan. It reads files line by line, identifies patterns, and executes actions on matches. Commonly used ",
        "sourcePath": "developer-roadmap/roadmaps/linux/content/awk@QTmECqpRVMjNgQU70uCF8.md"
      },
      {
        "id": "background--foreground-processes@mUKoiGUTpIaUgQNF3BND_",
        "title": "Background and Foreground Processes",
        "slug": "background--foreground-processes",
        "summary": "Linux processes run in foreground (taking direct user input) or background (running independently). Send processes to background with `&` or `bg` command. Bring to foreground with `fg`. Use Ctrl+Z to pause, then `bg` to ",
        "sourcePath": "developer-roadmap/roadmaps/linux/content/background--foreground-processes@mUKoiGUTpIaUgQNF3BND_.md"
      },
      {
        "id": "basic-commands@qLeEEwBvlGt1fP5Qcreah",
        "title": "Linux Navigation Basics: Basic Commands",
        "slug": "basic-commands",
        "summary": "Linux Navigation Basics is about using simple commands to move around and manage files on your computer. For example, `cd` lets you go into different folders, `ls` shows you what files and folders are inside, and `pwd` t",
        "sourcePath": "developer-roadmap/roadmaps/linux/content/basic-commands@qLeEEwBvlGt1fP5Qcreah.md"
      },
      {
        "id": "boot-loaders@o5lSQFW-V_PqndGqo1mp3",
        "title": "Boot Loaders",
        "slug": "boot-loaders",
        "summary": "Boot loaders load the OS kernel into memory when systems start. Common Linux boot loaders include GRUB (modern, feature-rich with graphical interface) and LILO (older, broader hardware support). Boot loaders initialize h",
        "sourcePath": "developer-roadmap/roadmaps/linux/content/boot-loaders@o5lSQFW-V_PqndGqo1mp3.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/linux"
  },
  {
    "slug": "mlops",
    "title": "Mlops",
    "category": "role",
    "description": "A practical path for becoming a stronger Mlops practitioner, from fundamentals to production-ready work.",
    "topicCount": 62,
    "topics": [
      {
        "id": "airflow@AjZHJcxUY29WZbCvr3zrs",
        "title": "Airflow",
        "slug": "airflow",
        "summary": "Airflow is a platform used to programmatically author, schedule, and monitor workflows. It allows you to define workflows as Directed Acyclic Graphs (DAGs) of tasks, where each task represents a unit of work. Airflow the",
        "sourcePath": "developer-roadmap/roadmaps/mlops/content/airflow@AjZHJcxUY29WZbCvr3zrs.md"
      },
      {
        "id": "ansible@-_obgPIUaZ4BVpg29xG_9",
        "title": "Ansible",
        "slug": "ansible",
        "summary": "Ansible is an open-source automation tool used to configure systems, deploy software, and orchestrate more advanced IT tasks. It uses a simple, human-readable language (YAML) to define automation tasks, called playbooks.",
        "sourcePath": "developer-roadmap/roadmaps/mlops/content/ansible@-_obgPIUaZ4BVpg29xG_9.md"
      },
      {
        "id": "aws--azure--gcp@u3E7FGW4Iwdsu61KYFxCX",
        "title": "AWS / Azure / GCP",
        "slug": "aws--azure--gcp",
        "summary": "AWS (Amazon Web Services), Azure, and GCP (Google Cloud Platform) are three leading providers of cloud computing services. AWS by Amazon is the oldest and the most established among the three, providing a breadth and dep",
        "sourcePath": "developer-roadmap/roadmaps/mlops/content/aws--azure--gcp@u3E7FGW4Iwdsu61KYFxCX.md"
      },
      {
        "id": "bash@mMzqJF2KQ49TDEk5F3VAI",
        "title": "Bash",
        "slug": "bash",
        "summary": "Bash (Bourne Again Shell) is a Unix shell and command language used for interacting with the operating system through a terminal. It allows users to execute commands, automate tasks via scripting, and manage system opera",
        "sourcePath": "developer-roadmap/roadmaps/mlops/content/bash@mMzqJF2KQ49TDEk5F3VAI.md"
      },
      {
        "id": "cicd@a6vawajw7BpL6plH_nuAz",
        "title": "CI/CD",
        "slug": "cicd",
        "summary": "CI/CD, which stands for Continuous Integration and Continuous Delivery/Deployment, is a software development practice that automates the process of building, testing, and deploying code changes. Continuous Integration fo",
        "sourcePath": "developer-roadmap/roadmaps/mlops/content/cicd@a6vawajw7BpL6plH_nuAz.md"
      },
      {
        "id": "cicd@oUhlUoWQQ1txx_sepD5ev",
        "title": "CI/CD",
        "slug": "cicd",
        "summary": "CI/CD, which stands for Continuous Integration and Continuous Delivery/Deployment, is a software development practice focused on automating and streamlining the process of building, testing, and releasing software change",
        "sourcePath": "developer-roadmap/roadmaps/mlops/content/cicd@oUhlUoWQQ1txx_sepD5ev.md"
      },
      {
        "id": "cloud-computing@00GZcwe25QYi7rDzaOoMt",
        "title": "Cloud Computing",
        "slug": "cloud-computing",
        "summary": "**Cloud Computing** refers to the delivery of computing services over the internet rather than using local servers or personal devices. These services include servers, storage, databases, networking, software, analytics,",
        "sourcePath": "developer-roadmap/roadmaps/mlops/content/cloud-computing@00GZcwe25QYi7rDzaOoMt.md"
      },
      {
        "id": "cloud-native-ml-services@kbfucfIO5KCsuv3jKbHTa",
        "title": "Cloud-Native ML Services",
        "slug": "cloud-native-ml-services",
        "summary": "Cloud-native ML services are pre-built machine learning tools and platforms offered by cloud providers. These services allow users to build, train, and deploy machine learning models without managing the underlying infra",
        "sourcePath": "developer-roadmap/roadmaps/mlops/content/cloud-native-ml-services@kbfucfIO5KCsuv3jKbHTa.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/mlops"
  },
  {
    "slug": "mongodb",
    "title": "Mongodb",
    "category": "skill",
    "description": "A focused learning path for mastering Mongodb, with concepts, tools, projects, and next steps.",
    "topicCount": 106,
    "topics": [
      {
        "id": "aggregation@gpihoIJkzSS1WOvmH2ueo",
        "title": "Aggregation",
        "slug": "aggregation",
        "summary": "Aggregation in MongoDB is a powerful framework for data processing and transformation using a pipeline of stages. Each stage performs specific operations like filtering, grouping, sorting, or computing values, allowing c",
        "sourcePath": "developer-roadmap/roadmaps/mongodb/content/aggregation@gpihoIJkzSS1WOvmH2ueo.md"
      },
      {
        "id": "all@hPPoO8ysGeEGEQhdveiDO",
        "title": "$all",
        "slug": "all",
        "summary": "The `$all` operator in MongoDB selects documents where an array field contains all specified elements, regardless of order or additional elements. It's useful for tag-based filtering and ensuring multiple required values",
        "sourcePath": "developer-roadmap/roadmaps/mongodb/content/all@hPPoO8ysGeEGEQhdveiDO.md"
      },
      {
        "id": "and@-62S4wRxHpIM2I59xjGun",
        "title": "$and",
        "slug": "and",
        "summary": "The `$and` operator in MongoDB performs logical AND operation on multiple query expressions, returning documents that satisfy all specified conditions. It accepts an array of query expressions and is implicitly used when",
        "sourcePath": "developer-roadmap/roadmaps/mongodb/content/and@-62S4wRxHpIM2I59xjGun.md"
      },
      {
        "id": "array@q6ZKxFcSAQ8bgUdGaDpuu",
        "title": "Array",
        "slug": "array",
        "summary": "Array data type in MongoDB stores ordered lists of values including mixed data types, nested arrays, and embedded documents. Arrays support indexing with multikey indexes, enabling efficient queries on array elements. Sp",
        "sourcePath": "developer-roadmap/roadmaps/mongodb/content/array@q6ZKxFcSAQ8bgUdGaDpuu.md"
      },
      {
        "id": "atlas-search-indexes@YidhAuVk_VGukx_FfJSz2",
        "title": "Atlas Search Indexes",
        "slug": "atlas-search-indexes",
        "summary": "Atlas Search indexes in MongoDB Atlas provide full-text search capabilities using Apache Lucene technology. They enable sophisticated text search with relevance scoring, autocomplete, faceted search, and synonyms. These ",
        "sourcePath": "developer-roadmap/roadmaps/mongodb/content/atlas-search-indexes@YidhAuVk_VGukx_FfJSz2.md"
      },
      {
        "id": "binary-data@UM6jH6bAijYS0Hmw87UQ-",
        "title": "Binary Data",
        "slug": "binary-data",
        "summary": "Binary data in MongoDB stores non-textual data like images, files, and encoded content using the BSON Binary data type. It supports various subtypes including generic binary, function code, UUID, and MD5 hashes. Binary d",
        "sourcePath": "developer-roadmap/roadmaps/mongodb/content/binary-data@UM6jH6bAijYS0Hmw87UQ-.md"
      },
      {
        "id": "boolean@hmo7zCZ1jKgobS5R0eBSD",
        "title": "Boolean",
        "slug": "boolean",
        "summary": "Boolean data type in MongoDB stores true or false values, representing logical states in documents. Booleans are commonly used for flags, status indicators, and conditional logic in queries and applications. They support",
        "sourcePath": "developer-roadmap/roadmaps/mongodb/content/boolean@hmo7zCZ1jKgobS5R0eBSD.md"
      },
      {
        "id": "bson-vs-json@F4W9XBSbkpzWIrAhRBSRS",
        "title": "BSON vs JSON",
        "slug": "bson-vs-json",
        "summary": "BSON (Binary JSON) is MongoDB's binary-encoded serialization format that extends JSON with additional data types like dates, binary data, and 64-bit integers. While JSON is human-readable text format, BSON provides faste",
        "sourcePath": "developer-roadmap/roadmaps/mongodb/content/bson-vs-json@F4W9XBSbkpzWIrAhRBSRS.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/mongodb"
  },
  {
    "slug": "network-engineer",
    "title": "Network Engineer",
    "category": "role",
    "description": "A practical path for becoming a stronger Network Engineer practitioner, from fundamentals to production-ready work.",
    "topicCount": 201,
    "topics": [
      {
        "id": "access-points--controllers@x1B9MVsG_C-CejgLAeTzA",
        "title": "Access Points & Controllers",
        "slug": "access-points--controllers",
        "summary": "Wireless access points (APs) are devices that broadcast Wi-Fi signals and connect wireless clients to a wired network. In larger deployments, multiple access points are managed by a wireless controller, which centralizes",
        "sourcePath": "developer-roadmap/roadmaps/network-engineer/content/access-points--controllers@x1B9MVsG_C-CejgLAeTzA.md"
      },
      {
        "id": "access-points@XPOTGRx3lpaHHNlzlMTPq",
        "title": "Access Points",
        "slug": "access-points",
        "summary": "A wireless access point (AP) is a device that creates a wireless local area network, typically in an office or large building, by connecting to a wired router or switch and broadcasting a Wi-Fi signal. Multiple access po",
        "sourcePath": "developer-roadmap/roadmaps/network-engineer/content/access-points@XPOTGRx3lpaHHNlzlMTPq.md"
      },
      {
        "id": "access-points@x1B9MVsG_C-CejgLAeTzA",
        "title": "Access Points",
        "slug": "access-points",
        "summary": "A wireless access point (AP) is a networking device that creates a Wi-Fi network by broadcasting a wireless signal and acting as a bridge between wireless clients and the wired network infrastructure. APs connect to the ",
        "sourcePath": "developer-roadmap/roadmaps/network-engineer/content/access-points@x1B9MVsG_C-CejgLAeTzA.md"
      },
      {
        "id": "acls@MVuNY7zJkimjXMMeXbVTa",
        "title": "ACLs",
        "slug": "acls",
        "summary": "ACLs, or Access Control Lists, are ordered sets of rules applied to a router or switch interface that permit or deny traffic based on criteria such as source IP address, destination IP address, protocol, and port number.",
        "sourcePath": "developer-roadmap/roadmaps/network-engineer/content/acls@MVuNY7zJkimjXMMeXbVTa.md"
      },
      {
        "id": "ansible@nbOAx9ljA8eZEYRpnvpOW",
        "title": "Ansible",
        "slug": "ansible",
        "summary": "Ansible is an open-source automation tool that uses simple, human-readable YAML files called playbooks to automate the configuration and management of servers, network devices, and cloud infrastructure. Unlike some autom",
        "sourcePath": "developer-roadmap/roadmaps/network-engineer/content/ansible@nbOAx9ljA8eZEYRpnvpOW.md"
      },
      {
        "id": "ap-placement--coverage@_KcUvubLvgG0s9pbxiDko",
        "title": "AP Placement & Coverage",
        "slug": "ap-placement--coverage",
        "summary": "AP placement is the process of determining the optimal physical location for access points to ensure complete wireless coverage across a space without dead zones or excessive overlap. Signal strength degrades with distan",
        "sourcePath": "developer-roadmap/roadmaps/network-engineer/content/ap-placement--coverage@_KcUvubLvgG0s9pbxiDko.md"
      },
      {
        "id": "apis-for-networking@PQyKcqw8-NIxE3_MAr58j",
        "title": "APIs",
        "slug": "apis-for-networking",
        "summary": "An API, or Application Programming Interface, is a standardized interface that allows software applications and automation tools to communicate with network devices and services programmatically, without a human typing c",
        "sourcePath": "developer-roadmap/roadmaps/network-engineer/content/apis-for-networking@PQyKcqw8-NIxE3_MAr58j.md"
      },
      {
        "id": "application@IVpbjVpRESZvx8k2Mik5B",
        "title": "Application",
        "slug": "application",
        "summary": "The Application layer is the seventh and topmost layer of the OSI model, where end-user software interacts with the network. It provides network services directly to applications, enabling functions like web browsing, em",
        "sourcePath": "developer-roadmap/roadmaps/network-engineer/content/application@IVpbjVpRESZvx8k2Mik5B.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/network-engineer"
  },
  {
    "slug": "nextjs",
    "title": "Nextjs",
    "category": "skill",
    "description": "A focused learning path for mastering Nextjs, with concepts, tools, projects, and next steps.",
    "topicCount": 94,
    "topics": [
      {
        "id": "adapters@fXXlJ6oN_YPWVr-fqEar3",
        "title": "Adapter",
        "slug": "adapters",
        "summary": "Next.js can be adapted to run on different platforms to support their infrastructure capabilities, including AWS Amplify Hosting, Cloudflare, Deno Deploy, Netlify, and Vercel.",
        "sourcePath": "developer-roadmap/roadmaps/nextjs/content/adapters@fXXlJ6oN_YPWVr-fqEar3.md"
      },
      {
        "id": "analytics@a34ZmSk5VYVLq8wsEvOcI",
        "title": "Analytics",
        "slug": "analytics",
        "summary": "Next.js has built-in support for measuring and reporting performance metrics. You can either use the `useReportWebVitals` hook to manage reporting yourself, or alternatively, Vercel provides a managed service to automati",
        "sourcePath": "developer-roadmap/roadmaps/nextjs/content/analytics@a34ZmSk5VYVLq8wsEvOcI.md"
      },
      {
        "id": "api-endpoints@4H8aOVYsZiPbTQUYcZjb_",
        "title": "API Endpoints",
        "slug": "api-endpoints",
        "summary": "API Routes let you create an API endpoint inside a Next.js app. API endpoints work differently in Pages routers and App Routers:",
        "sourcePath": "developer-roadmap/roadmaps/nextjs/content/api-endpoints@4H8aOVYsZiPbTQUYcZjb_.md"
      },
      {
        "id": "app@3VXKRDxDmqJObkoW8ndrz",
        "title": "App Router",
        "slug": "app",
        "summary": "The App Router is a file-system based router that uses React's latest features, such as [Server Components](https://react.dev/reference/rsc/server-components), [Suspense](https://react.dev/reference/react/Suspense), and ",
        "sourcePath": "developer-roadmap/roadmaps/nextjs/content/app@3VXKRDxDmqJObkoW8ndrz.md"
      },
      {
        "id": "caching-data@77i6HVsnX-uSDw8vz3afD",
        "title": "Caching Data",
        "slug": "caching-data",
        "summary": "Caching data in Next.js involves storing the results of data fetches so that subsequent requests for the same data can be served faster. Instead of repeatedly fetching data from a database or API, Next.js can retrieve it",
        "sourcePath": "developer-roadmap/roadmaps/nextjs/content/caching-data@77i6HVsnX-uSDw8vz3afD.md"
      },
      {
        "id": "caching@0Rgs7jaFX1Gl5KDT6DKbX",
        "title": "Caching API Endpoints in Next.js",
        "slug": "caching",
        "summary": "When you don't know the exact route segment names ahead of time and want to create routes from dynamic data, you can use Dynamic Segments that are filled in at request time or prerendered at build time. One example is ca",
        "sourcePath": "developer-roadmap/roadmaps/nextjs/content/caching@0Rgs7jaFX1Gl5KDT6DKbX.md"
      },
      {
        "id": "client-rendered@HdSmD_nDV5BPO5JJqs1k8",
        "title": "Client-Side Rendering in Next.js",
        "slug": "client-rendered",
        "summary": "Client-Side Rendering (CSR) means the browser receives a minimal HTML page from the server. The browser then downloads the JavaScript code, which is responsible for rendering the entire user interface. The JavaScript cod",
        "sourcePath": "developer-roadmap/roadmaps/nextjs/content/client-rendered@HdSmD_nDV5BPO5JJqs1k8.md"
      },
      {
        "id": "client@jYSa7UMmjb51pGAyU4PoB",
        "title": "Client-Side Data Fetching",
        "slug": "client",
        "summary": "Client-side data fetching involves retrieving data directly in the user's browser using JavaScript. This happens after the initial HTML content is loaded. When a user interacts with a page, or after a certain event, the ",
        "sourcePath": "developer-roadmap/roadmaps/nextjs/content/client@jYSa7UMmjb51pGAyU4PoB.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/nextjs"
  },
  {
    "slug": "openclaw",
    "title": "Openclaw",
    "category": "skill",
    "description": "A focused learning path for mastering Openclaw, with concepts, tools, projects, and next steps.",
    "topicCount": 122,
    "topics": [
      {
        "id": "adding-daemon@wGp4nsoZNTbM4wgAmrqjj",
        "title": "Adding Daemon",
        "slug": "adding-daemon",
        "summary": "A daemon is a background process that runs continuously without needing a terminal window open. Configuring Open Claw as a daemon ensures it starts automatically and keeps running even after you log out or restart your m",
        "sourcePath": "developer-roadmap/roadmaps/openclaw/content/adding-daemon@wGp4nsoZNTbM4wgAmrqjj.md"
      },
      {
        "id": "adding-first-channel@MbZFK1Q6ndoaDMsrf15Xi",
        "title": "Adding First Channel",
        "slug": "adding-first-channel",
        "summary": "After setting up your model provider, the next step is connecting a communication channel, in other words, the platform where you will actually talk to your agent. Telegram is recommended as the fastest channel to get st",
        "sourcePath": "developer-roadmap/roadmaps/openclaw/content/adding-first-channel@MbZFK1Q6ndoaDMsrf15Xi.md"
      },
      {
        "id": "agent-loop@oaXblhElJYZoLT4OS-7TQ",
        "title": "Agent Loop",
        "slug": "agent-loop",
        "summary": "When Open Claw receives a message, it runs a full agent loop rather than returning a single response. The loop validates the message, resolves the model, assembles the system prompt from skills and context files, and the",
        "sourcePath": "developer-roadmap/roadmaps/openclaw/content/agent-loop@oaXblhElJYZoLT4OS-7TQ.md"
      },
      {
        "id": "agents@i5pSML-UG6dqXETubMEs6",
        "title": "Agents",
        "slug": "agents",
        "summary": "An agent in Open Claw is a fully isolated unit with its own workspace folder containing its personality and configuration files, its own state directory that holds auth profiles and the model registry, and its own sessio",
        "sourcePath": "developer-roadmap/roadmaps/openclaw/content/agents@i5pSML-UG6dqXETubMEs6.md"
      },
      {
        "id": "agentsmd@4CT2VNLkpdqeartj2z0lt",
        "title": "AGENTS.md",
        "slug": "agentsmd",
        "summary": "[AGENTS.md](http://AGENTS.md) describes the agents available in your workspace, their roles, and how they relate to each other. It is used when running multiple agents to clarify who does what.",
        "sourcePath": "developer-roadmap/roadmaps/openclaw/content/agentsmd@4CT2VNLkpdqeartj2z0lt.md"
      },
      {
        "id": "allowlist@v4nwaFwHjh2UQ8rsBiTOo",
        "title": "/allowlist",
        "slug": "allowlist",
        "summary": "`/allowlist` lists, adds, or removes entries from the sender allowlist that controls who can interact with the agent. Add and remove operations require `commands.config: true` to be set in your configuration.",
        "sourcePath": "developer-roadmap/roadmaps/openclaw/content/allowlist@v4nwaFwHjh2UQ8rsBiTOo.md"
      },
      {
        "id": "anthropic@3bSTQ3nt5GdvKOder9J5R",
        "title": "Anthropic",
        "slug": "anthropic",
        "summary": "Anthropic is the company behind the Claude family of models. Connecting Open Claw to Anthropic lets you use Claude as your agent's underlying model, which is well-suited for reasoning, writing, and tool use.",
        "sourcePath": "developer-roadmap/roadmaps/openclaw/content/anthropic@3bSTQ3nt5GdvKOder9J5R.md"
      },
      {
        "id": "antropic@3bSTQ3nt5GdvKOder9J5R",
        "title": "Anthropic",
        "slug": "antropic",
        "summary": "Anthropic is the company behind the Claude family of models. Connecting Open Claw to Anthropic lets you use Claude as your agent's underlying model, which is well-suited for reasoning, writing, and tool use.",
        "sourcePath": "developer-roadmap/roadmaps/openclaw/content/antropic@3bSTQ3nt5GdvKOder9J5R.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/openclaw"
  },
  {
    "slug": "php",
    "title": "Php",
    "category": "skill",
    "description": "A focused learning path for mastering Php, with concepts, tools, projects, and next steps.",
    "topicCount": 120,
    "topics": [
      {
        "id": "_get@GFYGFVfxkOoPI5mI4zSt1",
        "title": "$_GET",
        "slug": "_get",
        "summary": "$\\_GET is a pre-defined array in PHP, that's used to collect form-data sent through HTTP GET method. It's useful whenever you need to process or interact with data that has been passed in via a URL's query string. For an",
        "sourcePath": "developer-roadmap/roadmaps/php/content/_get@GFYGFVfxkOoPI5mI4zSt1.md"
      },
      {
        "id": "_post@qNG-a4iIO-puZsMwAMzYC",
        "title": "$_POST",
        "slug": "_post",
        "summary": "`$_POST` is a superglobal variable in PHP that's used to collect form data submitted via HTTP POST method. Your PHP script can access this data through `$_POST`. Let's say you have a simple HTML form on your webpage. Whe",
        "sourcePath": "developer-roadmap/roadmaps/php/content/_post@qNG-a4iIO-puZsMwAMzYC.md"
      },
      {
        "id": "_request@A6rfW4uJhyfAX2b18_EEC",
        "title": "$_REQUEST",
        "slug": "_request",
        "summary": "$\\_REQUEST is a PHP superglobal variable that contains the contents of both $\\_GET, $\\_POST, and $\\_COOKIE. It is used to collect data sent via both the GET and POST methods, as well as cookies. $\\_REQUEST is useful if y",
        "sourcePath": "developer-roadmap/roadmaps/php/content/_request@A6rfW4uJhyfAX2b18_EEC.md"
      },
      {
        "id": "_server@7Ja2at_N9tRTlvSGahrqn",
        "title": "$_SERVER",
        "slug": "_server",
        "summary": "The `$_SERVER` is a superglobal in PHP, holding information about headers, paths, and script locations. $\\_SERVER is an associative array containing server variables created by the web server. This can include specific e",
        "sourcePath": "developer-roadmap/roadmaps/php/content/_server@7Ja2at_N9tRTlvSGahrqn.md"
      },
      {
        "id": "abstract-classes@ub79EkMiOmPBwXLRuYFL8",
        "title": "Abstract classes",
        "slug": "abstract-classes",
        "summary": "Abstract classes in PHP are those which cannot be instantiated on their own. They are simply blueprints for other classes, providing a predefined structure. By declaring a class as abstract, you can define methods withou",
        "sourcePath": "developer-roadmap/roadmaps/php/content/abstract-classes@ub79EkMiOmPBwXLRuYFL8.md"
      },
      {
        "id": "access-specifiers@RD2RaBmA2XWkEa13PTCTX",
        "title": "Access Specifiers",
        "slug": "access-specifiers",
        "summary": "Access specifiers, also known as access modifiers, in PHP are keywords used in the class context which define the visibility and accessibility of properties, methods and constants. PHP supports three types of access spec",
        "sourcePath": "developer-roadmap/roadmaps/php/content/access-specifiers@RD2RaBmA2XWkEa13PTCTX.md"
      },
      {
        "id": "anonymous-functions@Nr5m6wQLp7VyG3AucrSc8",
        "title": "Anonymous Functions",
        "slug": "anonymous-functions",
        "summary": "Anonymous functions in PHP, also known as closures, are functions that do not have a specified name. They are most frequently used as a value for callback parameters, but can be used in many other ways. When creating an ",
        "sourcePath": "developer-roadmap/roadmaps/php/content/anonymous-functions@Nr5m6wQLp7VyG3AucrSc8.md"
      },
      {
        "id": "apache@KMQqePqAjQ-ReDwHqeofx",
        "title": "Apache",
        "slug": "apache",
        "summary": "Apache is a popular web server that can efficiently host PHP applications. Apache integrates well with PHP, using its `mod_php` module, providing a stable and consistent environment for your PHP scripts to run. This comp",
        "sourcePath": "developer-roadmap/roadmaps/php/content/apache@KMQqePqAjQ-ReDwHqeofx.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/php"
  },
  {
    "slug": "postgresql-dba",
    "title": "PostgreSQL",
    "category": "role",
    "description": "A practical path for becoming a stronger PostgreSQL practitioner, from fundamentals to production-ready work.",
    "topicCount": 170,
    "topics": [
      {
        "id": "acid@9u7DPbfybqmldisiePq0m",
        "title": "ACID",
        "slug": "acid",
        "summary": "ACID are the four properties of relational database systems that help in making sure that we are able to perform the transactions in a reliable manner. It's an acronym which refers to the presence of four properties: ato",
        "sourcePath": "developer-roadmap/roadmaps/postgresql-dba/content/acid@9u7DPbfybqmldisiePq0m.md"
      },
      {
        "id": "adding-extra-extensions@VAf9VzPx70hUf4H6i3Z2t",
        "title": "Adding Extensions",
        "slug": "adding-extra-extensions",
        "summary": "PostgreSQL provides various extensions to enhance its features and functionalities. Extensions are optional packages that can be loaded into your PostgreSQL database to provide additional functionality like new data type",
        "sourcePath": "developer-roadmap/roadmaps/postgresql-dba/content/adding-extra-extensions@VAf9VzPx70hUf4H6i3Z2t.md"
      },
      {
        "id": "advanced-topics@09QX_zjCUajxUqcNZKy0x",
        "title": "Advanced Topics in PostgreSQL Security",
        "slug": "advanced-topics",
        "summary": "In addition to basic PostgreSQL security concepts, such as user authentication, privilege management, and encryption, there are several advanced topics that you should be aware of to enhance the security of your PostgreS",
        "sourcePath": "developer-roadmap/roadmaps/postgresql-dba/content/advanced-topics@09QX_zjCUajxUqcNZKy0x.md"
      },
      {
        "id": "aggregate-and-window-functions@iQqEC1CnVAoM7x455jO_S",
        "title": "Aggregate and Window Functions",
        "slug": "aggregate-and-window-functions",
        "summary": "Aggregate functions in PostgreSQL perform calculations on a set of rows and return a single value, such as `SUM()`, `AVG()`, `COUNT()`, `MAX()`, and `MIN()`. Window functions, on the other hand, calculate values across a",
        "sourcePath": "developer-roadmap/roadmaps/postgresql-dba/content/aggregate-and-window-functions@iQqEC1CnVAoM7x455jO_S.md"
      },
      {
        "id": "ansible@RqSfBR_RuvHrwHfPn1jwZ",
        "title": "Ansible for PostgreSQL Configuration Management",
        "slug": "ansible",
        "summary": "Ansible is a widely used open-source configuration management and provisioning tool that helps automate many tasks for managing servers, databases, and applications. It uses a simple, human-readable language called YAML ",
        "sourcePath": "developer-roadmap/roadmaps/postgresql-dba/content/ansible@RqSfBR_RuvHrwHfPn1jwZ.md"
      },
      {
        "id": "any-programming-language@j5YeixkCKRv0sfq_gFVr9",
        "title": "Programming Languages and PostgreSQL Automation",
        "slug": "any-programming-language",
        "summary": "PostgreSQL supports various languages for providing server-side scripting and developing custom functions, triggers, and stored procedures. When choosing a language, consider factors such as the complexity of the task, t",
        "sourcePath": "developer-roadmap/roadmaps/postgresql-dba/content/any-programming-language@j5YeixkCKRv0sfq_gFVr9.md"
      },
      {
        "id": "attributes@XvZMSveMWqmAlXOxwWzdk",
        "title": "Attributes in the Relational Model",
        "slug": "attributes",
        "summary": "Attributes in the relational model are the columns of a table, representing the properties or characteristics of the entity described by the table. Each attribute has a domain, defining the possible values it can take, s",
        "sourcePath": "developer-roadmap/roadmaps/postgresql-dba/content/attributes@XvZMSveMWqmAlXOxwWzdk.md"
      },
      {
        "id": "authentication-models@gb75xOcAr-q8TcA6_l1GZ",
        "title": "Authentication Models",
        "slug": "authentication-models",
        "summary": "PostgreSQL supports various authentication models to control access, including trust (no password, for secure environments), password-based (md5 and scram-sha-256 for hashed passwords), GSSAPI and SSPI (Kerberos for secu",
        "sourcePath": "developer-roadmap/roadmaps/postgresql-dba/content/authentication-models@gb75xOcAr-q8TcA6_l1GZ.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/postgresql-dba"
  },
  {
    "slug": "power-bi",
    "title": "Power BI",
    "category": "skill",
    "description": "A focused learning path for mastering Power BI, with concepts, tools, projects, and next steps.",
    "topicCount": 149,
    "topics": [
      {
        "id": "access-control@TB7tcRXwbvJ16fV6BHXPt",
        "title": "Access Control",
        "slug": "access-control",
        "summary": "Access control covers the mechanisms that determine who can see or interact with specific data and content in Power BI, spanning row-level security, object-level security, and workspace roles. It works at multiple levels",
        "sourcePath": "developer-roadmap/roadmaps/power-bi/content/access-control@TB7tcRXwbvJ16fV6BHXPt.md"
      },
      {
        "id": "accessibility@Qido2kFzf3UoW3LLu3QT-",
        "title": "Accessibility",
        "slug": "accessibility",
        "summary": "Accessibility in Power BI covers making reports usable for people with visual, motor, or cognitive impairments, including features like keyboard navigation, screen reader support, and color choices that work for color bl",
        "sourcePath": "developer-roadmap/roadmaps/power-bi/content/accessibility@Qido2kFzf3UoW3LLu3QT-.md"
      },
      {
        "id": "advanced-dax@4j2CBBcLxNnE060LMnDTc",
        "title": "Advanced DAX",
        "slug": "advanced-dax",
        "summary": "Advanced DAX covers techniques beyond the core functions, such as quick measures, field parameters, visual calculations, and calculation groups, which solve more specialized reporting problems. These features often exist",
        "sourcePath": "developer-roadmap/roadmaps/power-bi/content/advanced-dax@4j2CBBcLxNnE060LMnDTc.md"
      },
      {
        "id": "advanced-editor@U8ZpXzVc0xFZ-A74a_yuZ",
        "title": "Advanced Editor",
        "slug": "advanced-editor",
        "summary": "The Advanced Editor is a text view in Power Query that shows and lets users directly edit the full M code behind a query. It is used to write custom logic, fix errors that the interface cannot show clearly, or copy queri",
        "sourcePath": "developer-roadmap/roadmaps/power-bi/content/advanced-editor@U8ZpXzVc0xFZ-A74a_yuZ.md"
      },
      {
        "id": "advanced-visuals@js9MnMCVPoWWb9wLf_csS",
        "title": "Advanced Visuals",
        "slug": "advanced-visuals",
        "summary": "Advanced visuals are analytical tools that go beyond standard charts, including the decomposition tree, key influencers, small multiples, and the Q&A visual, each aimed at deeper exploration of the data rather than simpl",
        "sourcePath": "developer-roadmap/roadmaps/power-bi/content/advanced-visuals@js9MnMCVPoWWb9wLf_csS.md"
      },
      {
        "id": "aggregation-functions@LCVPHuTjQ4zTi0tT77h9y",
        "title": "Aggregation Functions",
        "slug": "aggregation-functions",
        "summary": "Aggregation functions in DAX, such as SUM, AVERAGE, COUNT, and MIN, combine values across rows into a single number. They form the basis of most measures, often summing or averaging a column across whatever rows are visi",
        "sourcePath": "developer-roadmap/roadmaps/power-bi/content/aggregation-functions@LCVPHuTjQ4zTi0tT77h9y.md"
      },
      {
        "id": "aggregations@KeyKztPuGQrZpG4WR3VOX",
        "title": "Aggregations",
        "slug": "aggregations",
        "summary": "Aggregations in Power BI store pre-summarized versions of a large, detailed table, allowing queries at high summary levels to hit the smaller aggregated table instead of the full detail. This speeds up report performance",
        "sourcePath": "developer-roadmap/roadmaps/power-bi/content/aggregations@KeyKztPuGQrZpG4WR3VOX.md"
      },
      {
        "id": "apis@HWj-k3pc5_80dk793CVnX",
        "title": "APIs",
        "slug": "apis",
        "summary": "Power BI can pull data from web APIs that return structured data, usually in JSON or XML format, using the web connector or custom M queries. This lets reports pull in live data from services that expose an API endpoint,",
        "sourcePath": "developer-roadmap/roadmaps/power-bi/content/apis@HWj-k3pc5_80dk793CVnX.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/power-bi"
  },
  {
    "slug": "product-design",
    "title": "Product Design",
    "category": "role",
    "description": "A practical path for becoming a stronger Product Design practitioner, from fundamentals to production-ready work.",
    "topicCount": 118,
    "topics": [
      {
        "id": "ab-testing@tI31OEk2oI2CzTLZ3kCQl",
        "title": "A/B Testing",
        "slug": "ab-testing",
        "summary": "A/B testing compares two versions of a design, showing each version to a separate group of users, to measure which one performs better against a specific metric. Because only one variable typically changes between versio",
        "sourcePath": "developer-roadmap/roadmaps/product-design/content/ab-testing@tI31OEk2oI2CzTLZ3kCQl.md"
      },
      {
        "id": "accessibility-testing@QOvNo5vsPhIJCSDQu3-Ln",
        "title": "Accessibility Testing",
        "slug": "accessibility-testing",
        "summary": "Accessibility testing evaluates whether a product can be used effectively by people with disabilities, including those using screen readers, keyboard-only navigation, or other assistive technology. It checks things like ",
        "sourcePath": "developer-roadmap/roadmaps/product-design/content/accessibility-testing@QOvNo5vsPhIJCSDQu3-Ln.md"
      },
      {
        "id": "agile-ux-lean-ux@5vPrv890AGAMy3VPl9gwk",
        "title": "Agile UX, Lean UX",
        "slug": "agile-ux-lean-ux",
        "summary": "Agile UX and Lean UX are approaches to design that fit within iterative, fast-moving development cycles rather than lengthy upfront design phases. They favor small, testable increments of design work, tight feedback loop",
        "sourcePath": "developer-roadmap/roadmaps/product-design/content/agile-ux-lean-ux@5vPrv890AGAMy3VPl9gwk.md"
      },
      {
        "id": "ai-assisted-design@WC7fqDlXZyONf11qzDpdJ",
        "title": "AI-Assisted Design",
        "slug": "ai-assisted-design",
        "summary": "AI-assisted design refers to using artificial intelligence tools to support parts of the design process, such as generating layout variations, writing draft copy, or producing quick visual concepts. These tools can speed",
        "sourcePath": "developer-roadmap/roadmaps/product-design/content/ai-assisted-design@WC7fqDlXZyONf11qzDpdJ.md"
      },
      {
        "id": "aligning-teams@jAhHs0Ba18emgZBdn77Gd",
        "title": "Aligning Teams",
        "slug": "aligning-teams",
        "summary": "Aligning teams is the ongoing work of getting stakeholders, designers, and engineers to agree on direction, priorities, and process. It includes practices like stakeholder alignment, adopting shared methods such as Agile",
        "sourcePath": "developer-roadmap/roadmaps/product-design/content/aligning-teams@jAhHs0Ba18emgZBdn77Gd.md"
      },
      {
        "id": "api--data-limitations@l6hgxqruST7xBBypypQFs",
        "title": "API & Data Limitations",
        "slug": "api--data-limitations",
        "summary": "API and data limitations refer to the technical boundaries imposed by the software services that power a digital product, such as how much information can be retrieved at once, how quickly it can be updated, or what spec",
        "sourcePath": "developer-roadmap/roadmaps/product-design/content/api--data-limitations@l6hgxqruST7xBBypypQFs.md"
      },
      {
        "id": "assumption-mapping@pWiKXyU5rUxvutXhpgcBD",
        "title": "Assumption Mapping",
        "slug": "assumption-mapping",
        "summary": "Assumption mapping is the practice of listing out the underlying beliefs a product idea depends on, then ranking them by how risky and how uncertain each one is. It helps a team see which assumptions need to be tested be",
        "sourcePath": "developer-roadmap/roadmaps/product-design/content/assumption-mapping@pWiKXyU5rUxvutXhpgcBD.md"
      },
      {
        "id": "brainstorming@Ypy2m6Y_-kkqwpfanwbQ3",
        "title": "Brainstorming",
        "slug": "brainstorming",
        "summary": "Brainstorming is a group activity where participants generate as many ideas as possible for solving a problem, typically without judging or filtering them in the moment. The emphasis on quantity over quality early on hel",
        "sourcePath": "developer-roadmap/roadmaps/product-design/content/brainstorming@Ypy2m6Y_-kkqwpfanwbQ3.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/product-design"
  },
  {
    "slug": "product-manager",
    "title": "Product Manager",
    "category": "role",
    "description": "A practical path for becoming a stronger Product Manager practitioner, from fundamentals to production-ready work.",
    "topicCount": 172,
    "topics": [
      {
        "id": "ab-testing@V3yGVN7z_ihLkScO0_92_",
        "title": "A/B Testing in Data-Driven Decision Making",
        "slug": "ab-testing",
        "summary": "The role of a Product Manager often requires making informed decisions to improve product performance and user experience. This is where A/B Testing, a vital aspect of data-driven decision making, comes into play. A/B Te",
        "sourcePath": "developer-roadmap/roadmaps/product-manager/content/ab-testing@V3yGVN7z_ihLkScO0_92_.md"
      },
      {
        "id": "ab-testing@Ws7IFrHQNoBjLE2Td2xIZ",
        "title": "A/B Testing",
        "slug": "ab-testing",
        "summary": "A/B testing, otherwise known as split testing, is an essential statistical tool that is central to the responsibilities of a product manager. This method involves comparing two versions of a webpage, product feature, or ",
        "sourcePath": "developer-roadmap/roadmaps/product-manager/content/ab-testing@Ws7IFrHQNoBjLE2Td2xIZ.md"
      },
      {
        "id": "active-listening@FwYc1942Z0_KYih0BQ1CL",
        "title": "Active Listening",
        "slug": "active-listening",
        "summary": "Active Listening is a fundamental skill for a Product Manager. It involves giving full attention to the speaker and showing interest in the information provided. This encompasses comprehending, retaining, and effectively",
        "sourcePath": "developer-roadmap/roadmaps/product-manager/content/active-listening@FwYc1942Z0_KYih0BQ1CL.md"
      },
      {
        "id": "advanced-analysis@9y_I41kJhkmyBJjiTw8Xd",
        "title": "Advanced Analysis",
        "slug": "advanced-analysis",
        "summary": "The field of Advanced Analysis plays a pivotal role in the domain of Product Management. As the driving force behind decision-making, it incorporates sophisticated methods and tools to draw meaning from data, enabling Pr",
        "sourcePath": "developer-roadmap/roadmaps/product-manager/content/advanced-analysis@9y_I41kJhkmyBJjiTw8Xd.md"
      },
      {
        "id": "agile-methodology@sAu4Gr1hg8S4jAV0bOSdY",
        "title": "Agile Methodology",
        "slug": "agile-methodology",
        "summary": "Agile Methodology in product management refers to an iterative approach to project management and product development, where requirements and solutions evolve through collaboration among cross-functional teams. As a Prod",
        "sourcePath": "developer-roadmap/roadmaps/product-manager/content/agile-methodology@sAu4Gr1hg8S4jAV0bOSdY.md"
      },
      {
        "id": "aha@dr5BLjsZXk50R7vp3cMsu",
        "title": "Aha as a Roadmapping Tool",
        "slug": "aha",
        "summary": "Aha, as a roadmapping tool, is an indispensable toolset in the arsenal of a Product Manager. It's a comprehensive product management suite that focuses on strategy and roadmapping. Its ability to build visual roadmaps, p",
        "sourcePath": "developer-roadmap/roadmaps/product-manager/content/aha@dr5BLjsZXk50R7vp3cMsu.md"
      },
      {
        "id": "ai-in-product-mgmt@H7sf23kwv73XjnFCdKHPi",
        "title": "AI in Product Management",
        "slug": "ai-in-product-mgmt",
        "summary": "Artificial Intelligence (AI) has been increasingly instrumental in shaping the field of product management. As a product manager, it is crucial to comprehend the implications and applicability of AI in managing products ",
        "sourcePath": "developer-roadmap/roadmaps/product-manager/content/ai-in-product-mgmt@H7sf23kwv73XjnFCdKHPi.md"
      },
      {
        "id": "alignment--buy-in@D5GXDeApGwjmLG2-KF2pr",
        "title": "Alignment & Buy-In",
        "slug": "alignment--buy-in",
        "summary": "Alignment and Buy-In is a crucial aspect of product management. As a Product Manager, one needs to ensure that the team is aligned with the product vision and roadmap. This involves gaining buy-in from key stakeholders, ",
        "sourcePath": "developer-roadmap/roadmaps/product-manager/content/alignment--buy-in@D5GXDeApGwjmLG2-KF2pr.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/product-manager"
  },
  {
    "slug": "prompt-engineering",
    "title": "Prompt Engineering",
    "category": "skill",
    "description": "A focused learning path for mastering Prompt Engineering, with concepts, tools, projects, and next steps.",
    "topicCount": 46,
    "topics": [
      {
        "id": "agents@Pw5LWA9vNRY0N2M0FW16f",
        "title": "Agents",
        "slug": "agents",
        "summary": "AI agents are autonomous systems that use LLMs to reason, plan, and take actions to achieve specific goals. They combine language understanding with tool usage, memory, and decision-making to perform complex, multi-step ",
        "sourcePath": "developer-roadmap/roadmaps/prompt-engineering/content/agents@Pw5LWA9vNRY0N2M0FW16f.md"
      },
      {
        "id": "ai-red-teaming@Wvu9Q_kNhH1_JlOgxAjP6",
        "title": "AI Red Teaming",
        "slug": "ai-red-teaming",
        "summary": "AI red teaming involves deliberately testing AI systems to find vulnerabilities, biases, or harmful behaviors through adversarial prompting. Teams attempt to make models produce undesired outputs, bypass safety measures,",
        "sourcePath": "developer-roadmap/roadmaps/prompt-engineering/content/ai-red-teaming@Wvu9Q_kNhH1_JlOgxAjP6.md"
      },
      {
        "id": "ai-vs-agi@Sj1CMZzZp8kF-LuHcd_UU",
        "title": "AI vs AGI",
        "slug": "ai-vs-agi",
        "summary": "AI (Artificial Intelligence) refers to systems that perform specific tasks intelligently, while AGI (Artificial General Intelligence) represents hypothetical AI with human-level reasoning across all domains. Current LLMs",
        "sourcePath": "developer-roadmap/roadmaps/prompt-engineering/content/ai-vs-agi@Sj1CMZzZp8kF-LuHcd_UU.md"
      },
      {
        "id": "anthropic@V8pDOwrRKKcHBTd4qlSsH",
        "title": "Anthropic",
        "slug": "anthropic",
        "summary": "Anthropic develops Claude, a family of large language models focused on safety and helpfulness. The current lineup includes Claude Opus 4.7 (most capable, for complex reasoning and agentic coding), Claude Sonnet 4.6 (bes",
        "sourcePath": "developer-roadmap/roadmaps/prompt-engineering/content/anthropic@V8pDOwrRKKcHBTd4qlSsH.md"
      },
      {
        "id": "automatic-prompt-engineering@diHNCiuKHeMVgvJ4OMwVh",
        "title": "Automatic Prompt Engineering",
        "slug": "automatic-prompt-engineering",
        "summary": "Automatic Prompt Engineering (APE) uses LLMs to generate and optimize prompts automatically, reducing human effort while enhancing model performance. The process involves prompting a model to create multiple prompt varia",
        "sourcePath": "developer-roadmap/roadmaps/prompt-engineering/content/automatic-prompt-engineering@diHNCiuKHeMVgvJ4OMwVh.md"
      },
      {
        "id": "calibrating-llms@P5nDyQbME53DOEfSkcY6I",
        "title": "Calibrating LLMs",
        "slug": "calibrating-llms",
        "summary": "Calibrating LLMs involves adjusting models so their confidence scores accurately reflect their actual accuracy. Well-calibrated models express appropriate uncertainty - being confident when correct and uncertain when lik",
        "sourcePath": "developer-roadmap/roadmaps/prompt-engineering/content/calibrating-llms@P5nDyQbME53DOEfSkcY6I.md"
      },
      {
        "id": "chain-of-thought-cot-prompting@weRaJxEplhKDyFWSMeoyI",
        "title": "Chain of Thought (CoT) Prompting",
        "slug": "chain-of-thought-cot-prompting",
        "summary": "Chain of Thought prompting improves LLM reasoning by generating intermediate reasoning steps before providing the final answer. Instead of jumping to conclusions, the model \"thinks through\" problems step by step. Simply ",
        "sourcePath": "developer-roadmap/roadmaps/prompt-engineering/content/chain-of-thought-cot-prompting@weRaJxEplhKDyFWSMeoyI.md"
      },
      {
        "id": "context-window@b-Xtkv6rt8QgzJXSShOX-",
        "title": "Context Window",
        "slug": "context-window",
        "summary": "Context window refers to the maximum number of tokens an LLM can process in a single interaction, including both input prompt and generated output. When exceeded, older parts are truncated. Understanding this constraint ",
        "sourcePath": "developer-roadmap/roadmaps/prompt-engineering/content/context-window@b-Xtkv6rt8QgzJXSShOX-.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/prompt-engineering"
  },
  {
    "slug": "python-data-analysis",
    "title": "Python for Data Analysis",
    "category": "skill",
    "description": "A focused learning path for mastering Python for Data Analysis, with concepts, tools, projects, and next steps.",
    "topicCount": 113,
    "topics": [
      {
        "id": "airflow@LERo7-ggtfZ-KZyNdBwt6",
        "title": "Airflow",
        "slug": "airflow",
        "summary": "Apache Airflow is an open-source platform for authoring, scheduling, and monitoring data pipelines. Pipelines are defined as DAGs (Directed Acyclic Graphs) in Python, where each node is a task and edges define dependenci",
        "sourcePath": "developer-roadmap/roadmaps/python-data-analysis/content/airflow@LERo7-ggtfZ-KZyNdBwt6.md"
      },
      {
        "id": "altair@9vgD1Sd5B3iRMPLrfMG0C",
        "title": "Altair",
        "slug": "altair",
        "summary": "Altair is a declarative statistical visualization library for Python based on the Vega-Lite grammar. Charts are built by binding data columns to visual channels (x, y, color, size) and specifying the mark type. Altair pr",
        "sourcePath": "developer-roadmap/roadmaps/python-data-analysis/content/altair@9vgD1Sd5B3iRMPLrfMG0C.md"
      },
      {
        "id": "apis-with-requests@10c4tiBOR68J3qa55LcJS",
        "title": "APIs with requests",
        "slug": "apis-with-requests",
        "summary": "The `requests` library is the standard Python tool for making HTTP requests. It is used to call REST APIs that return JSON or XML data. A typical workflow involves calling `requests.get(url, params=params)`, checking the",
        "sourcePath": "developer-roadmap/roadmaps/python-data-analysis/content/apis-with-requests@10c4tiBOR68J3qa55LcJS.md"
      },
      {
        "id": "args--kwargs@7ukR74cN6lHbvhs4mFn6R",
        "title": "args & kwargs",
        "slug": "args--kwargs",
        "summary": "`*args` allows a function to accept any number of positional arguments as a tuple. `**kwargs` allows any number of keyword arguments as a dictionary. They make functions flexible when the number or names of arguments are",
        "sourcePath": "developer-roadmap/roadmaps/python-data-analysis/content/args--kwargs@7ukR74cN6lHbvhs4mFn6R.md"
      },
      {
        "id": "arithmetic@AAxvIAas2Sdkz9-2uNHXq",
        "title": "Arithmetic",
        "slug": "arithmetic",
        "summary": "Arithmetic operators perform mathematical calculations: `+` (addition), `-` (subtraction), `*` (multiplication), `/` (division), `//` (floor division), `%` (modulo), and `**` (exponentiation). They are used constantly fo",
        "sourcePath": "developer-roadmap/roadmaps/python-data-analysis/content/arithmetic@AAxvIAas2Sdkz9-2uNHXq.md"
      },
      {
        "id": "array-operations@qOZ-T7zaPjvIT222rSV4o",
        "title": "Array Operations",
        "slug": "array-operations",
        "summary": "NumPy supports a wide range of array operations: element-wise arithmetic, aggregation functions (`sum`, `mean`, `std`, `min`, `max`), reshaping, stacking, and splitting. These operations are vectorized, meaning they appl",
        "sourcePath": "developer-roadmap/roadmaps/python-data-analysis/content/array-operations@qOZ-T7zaPjvIT222rSV4o.md"
      },
      {
        "id": "arrays--ndarray@qiUPTXFgfukxlPhnv76jo",
        "title": "Arrays & ndarray",
        "slug": "arrays--ndarray",
        "summary": "The `ndarray` is NumPy's core data structure: a multi-dimensional, homogeneously typed array stored in contiguous memory. It supports element-wise operations, broadcasting, and vectorized computation far faster than Pyth",
        "sourcePath": "developer-roadmap/roadmaps/python-data-analysis/content/arrays--ndarray@qiUPTXFgfukxlPhnv76jo.md"
      },
      {
        "id": "beautifulsoup@w4K_ffCUbzhGxWyoKsspu",
        "title": "BeautifulSoup",
        "slug": "beautifulsoup",
        "summary": "BeautifulSoup is a Python library for parsing HTML and XML documents. It provides methods for navigating the document tree, searching for elements by tag, class, or attribute, and extracting text and links. BeautifulSoup",
        "sourcePath": "developer-roadmap/roadmaps/python-data-analysis/content/beautifulsoup@w4K_ffCUbzhGxWyoKsspu.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/python-data-analysis"
  },
  {
    "slug": "qa",
    "title": "Qa",
    "category": "role",
    "description": "A practical path for becoming a stronger Qa practitioner, from fundamentals to production-ready work.",
    "topicCount": 146,
    "topics": [
      {
        "id": "accessibility-testing@zGzpjxz3nvVH9Eu3NOPbk",
        "title": "Accessibility Testing",
        "slug": "accessibility-testing",
        "summary": "Accessibility Testing is defined as a type of Software Testing performed to ensure that the application being tested is usable by people with disabilities like hearing, color blindness, old age, low vision and other disa",
        "sourcePath": "developer-roadmap/roadmaps/qa/content/accessibility-testing@zGzpjxz3nvVH9Eu3NOPbk.md"
      },
      {
        "id": "accessibility-tests@mmDIqSD6MU3ZhWREGI5E2",
        "title": "Accessibility testing",
        "slug": "accessibility-tests",
        "summary": "In software QA, accessibility testing is the practice of confirming that an application is usable for as many people as possible, including people with disabilities such as vision impairment, hearing problems and cogniti",
        "sourcePath": "developer-roadmap/roadmaps/qa/content/accessibility-tests@mmDIqSD6MU3ZhWREGI5E2.md"
      },
      {
        "id": "agile-model@47NXgbc1OTGE06qXxlQoh",
        "title": "Agile Model",
        "slug": "agile-model",
        "summary": "The Agile model is an iterative, incremental approach to software development that delivers working software in short cycles called sprints or iterations. Testing is integrated throughout each iteration rather than as a ",
        "sourcePath": "developer-roadmap/roadmaps/qa/content/agile-model@47NXgbc1OTGE06qXxlQoh.md"
      },
      {
        "id": "ajax@jn02FD5hjhZFVWaJjjNN3",
        "title": "Ajax",
        "slug": "ajax",
        "summary": "AJAX stands for Asynchronous JavaScript And XML. In a nutshell, it is the use of the XMLHttpRequest object to communicate with servers. It can send and receive information in various formats, including JSON, XML, HTML, a",
        "sourcePath": "developer-roadmap/roadmaps/qa/content/ajax@jn02FD5hjhZFVWaJjjNN3.md"
      },
      {
        "id": "allure@jaHOo-vZGjTnABxQKMT3_",
        "title": "Allure",
        "slug": "allure",
        "summary": "Allure Report is a flexible, lightweight multi-language test reporting tool. It provides clear graphical reports and allows everyone involved in the development process to extract the maximum of information from the ever",
        "sourcePath": "developer-roadmap/roadmaps/qa/content/allure@jaHOo-vZGjTnABxQKMT3_.md"
      },
      {
        "id": "appium@UIKUiCfSw5MkrRJZ3Ah3x",
        "title": "Appium",
        "slug": "appium",
        "summary": "Appium is an open-source framework that allows QAs to conduct automated app testing on different platforms like Android, iOS, and Windows. It is developed and supported by Sauce Labs to automate native and hybrid mobile ",
        "sourcePath": "developer-roadmap/roadmaps/qa/content/appium@UIKUiCfSw5MkrRJZ3Ah3x.md"
      },
      {
        "id": "artillery@j1DYOQbIUT1tw_9WIPBkE",
        "title": "Artillery",
        "slug": "artillery",
        "summary": "Artillery is an open-source load testing toolkit for APIs and microservices. Test scenarios are defined in YAML or JavaScript, and it supports HTTP, WebSocket, and [Socket.io](http://Socket.io) protocols. Artillery is de",
        "sourcePath": "developer-roadmap/roadmaps/qa/content/artillery@j1DYOQbIUT1tw_9WIPBkE.md"
      },
      {
        "id": "assembla@xLPE9CqqiYz0miMFI3ThY",
        "title": "Assembla",
        "slug": "assembla",
        "summary": "Assembla is an extensive suite of applications for software development, enabling distributed agile teams. It allows development teams to manage, initiate and maintain agile projects, applications and websites.",
        "sourcePath": "developer-roadmap/roadmaps/qa/content/assembla@xLPE9CqqiYz0miMFI3ThY.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/qa"
  },
  {
    "slug": "r",
    "title": "R",
    "category": "role",
    "description": "A practical path for becoming a stronger R practitioner, from fundamentals to production-ready work.",
    "topicCount": 129,
    "topics": [
      {
        "id": "aesthetic-mappings@HDWIMwjBFh4vKw_BYo0bF",
        "title": "Aesthetic Mappings",
        "slug": "aesthetic-mappings",
        "summary": "Aesthetic mappings connect columns in your data to visual properties of a plot, like position, color, size, or shape. Writing `aes(x = year, y = revenue, color = region)` tells ggplot2 to plot year against revenue and co",
        "sourcePath": "developer-roadmap/roadmaps/r/content/aesthetic-mappings@HDWIMwjBFh4vKw_BYo0bF.md"
      },
      {
        "id": "apis@V_cnhs4qzp-SLnLaGXC1l",
        "title": "APIs",
        "slug": "apis",
        "summary": "Web APIs let you request data over the internet from another service, typically returning it in JSON format. Fetching data from an API in R usually means making an HTTP request with a package like httr, then parsing the ",
        "sourcePath": "developer-roadmap/roadmaps/r/content/apis@V_cnhs4qzp-SLnLaGXC1l.md"
      },
      {
        "id": "apply-family@yqCapCzAFkWZvebvkuHNV",
        "title": "Apply Family",
        "slug": "apply-family",
        "summary": "The apply family is a set of base R functions that apply another function to every element of a vector, list, or data structure, replacing many uses of explicit loops. `lapply()` always returns a list, `sapply()` tries t",
        "sourcePath": "developer-roadmap/roadmaps/r/content/apply-family@yqCapCzAFkWZvebvkuHNV.md"
      },
      {
        "id": "arguments--defaults@qSJI_xsSN3wPY3ud0bZdm",
        "title": "Arguments & Defaults",
        "slug": "arguments--defaults",
        "summary": "Function arguments are the inputs a function accepts, and default values let you specify what an argument should be if the caller doesn't provide one. Writing `function(x, na.rm = FALSE)` means `na.rm` defaults to `FALSE",
        "sourcePath": "developer-roadmap/roadmaps/r/content/arguments--defaults@qSJI_xsSN3wPY3ud0bZdm.md"
      },
      {
        "id": "arrays@fy2pI0rjkw9d8THIHgDuN",
        "title": "Arrays",
        "slug": "arrays",
        "summary": "An array generalizes a matrix to more than two dimensions, storing values of a single type across any number of dimensions you specify. Arrays are less common in everyday data analysis than vectors or data frames, but th",
        "sourcePath": "developer-roadmap/roadmaps/r/content/arrays@fy2pI0rjkw9d8THIHgDuN.md"
      },
      {
        "id": "base-r-plotting@Ytwncvf4YOgLPNnczOpts",
        "title": "Base R Plotting",
        "slug": "base-r-plotting",
        "summary": "Base R includes plotting functions like `plot()`, `hist()`, and `boxplot()` that don't require any additional package. They're quick to use for a fast look at data and require no setup. Base R plots are generally less po",
        "sourcePath": "developer-roadmap/roadmaps/r/content/base-r-plotting@Ytwncvf4YOgLPNnczOpts.md"
      },
      {
        "id": "basic-syntax@nDFlbYOe7U7mVJadKYy_W",
        "title": "Basic Syntax",
        "slug": "basic-syntax",
        "summary": "This section covers the fundamental building blocks of writing R code: variables, operators, comments, and basic control structures. It's the vocabulary you need before anything more complex makes sense.",
        "sourcePath": "developer-roadmap/roadmaps/r/content/basic-syntax@nDFlbYOe7U7mVJadKYy_W.md"
      },
      {
        "id": "best-practices@OLOZSNHrOFD3claBXNKxP",
        "title": "Best Practices",
        "slug": "best-practices",
        "summary": "Good data visualization practice means choosing chart types and design choices that communicate data accurately rather than misleadingly. Common anti-patterns include truncated axes that exaggerate differences and color ",
        "sourcePath": "developer-roadmap/roadmaps/r/content/best-practices@OLOZSNHrOFD3claBXNKxP.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/r"
  },
  {
    "slug": "react-native",
    "title": "React Native",
    "category": "skill",
    "description": "A focused learning path for mastering React Native, with concepts, tools, projects, and next steps.",
    "topicCount": 94,
    "topics": [
      {
        "id": "accessibility@KoXTwQUqPt_ZhOFuaelny",
        "title": "Accessibility",
        "slug": "accessibility",
        "summary": "Accessibility (often abbreviated as a11y) in React Native is a crucial aspect of application development that ensures your applications are usable by everyone, including individuals with disabilities. This commitment to ",
        "sourcePath": "developer-roadmap/roadmaps/react-native/content/accessibility@KoXTwQUqPt_ZhOFuaelny.md"
      },
      {
        "id": "activityindicator@hHFR59RrdMIWxcQe72qCs",
        "title": "Activity Indicator",
        "slug": "activityindicator",
        "summary": "The `ActivityIndicator` is a core component in React Native that provides a simple visual indication of some ongoing activity or loading state within your application. It shows a spinning animation, which gives the user ",
        "sourcePath": "developer-roadmap/roadmaps/react-native/content/activityindicator@hHFR59RrdMIWxcQe72qCs.md"
      },
      {
        "id": "animations@3NLcPO-hqQV1EacoPLVrv",
        "title": "Animations",
        "slug": "animations",
        "summary": "React Native supports two types of animations: `Animated` and `LayoutAnimation`. The `Animated` API provides a basic set of methods for creating and managing animations, while the `LayoutAnimation` API provides a way to ",
        "sourcePath": "developer-roadmap/roadmaps/react-native/content/animations@3NLcPO-hqQV1EacoPLVrv.md"
      },
      {
        "id": "appium@spTzJMS7cE0cNa7tVQhVQ",
        "title": "Appium",
        "slug": "appium",
        "summary": "Appium is an open-source test automation framework for mobile devices, targeting native, hybrid, or mobile-web apps for iOS, Android, and Windows platforms. Appium works with multiple programming languages, including Jav",
        "sourcePath": "developer-roadmap/roadmaps/react-native/content/appium@spTzJMS7cE0cNa7tVQhVQ.md"
      },
      {
        "id": "apple-app-store@1s9Y1dUtjpW9pu74ipX99",
        "title": "Publishing Apps in App Store",
        "slug": "apple-app-store",
        "summary": "The App Store is Apple's official platform for distributing iOS apps to users with iPhones, iPads, and iPod Touch devices. To publish an app on the App Store, you need to follow specific guidelines and use the necessary ",
        "sourcePath": "developer-roadmap/roadmaps/react-native/content/apple-app-store@1s9Y1dUtjpW9pu74ipX99.md"
      },
      {
        "id": "authentication@LRBHwYiT0Yyi18PwR49rc",
        "title": "Authentication",
        "slug": "authentication",
        "summary": "Authentication is a crucial aspect of securing your React Native application. It enables you to verify the identity of users and give access to protected resources and features. Here are the common methods used for authe",
        "sourcePath": "developer-roadmap/roadmaps/react-native/content/authentication@LRBHwYiT0Yyi18PwR49rc.md"
      },
      {
        "id": "button@kkH9H9Qh1FD7sLItoWw69",
        "title": "Button",
        "slug": "button",
        "summary": "A `Button` is a built-in React Native component used to create clickable buttons. It is a simple, customizable and easy-to-use component that captures touches and triggers an `onPress` event when pressed.",
        "sourcePath": "developer-roadmap/roadmaps/react-native/content/button@kkH9H9Qh1FD7sLItoWw69.md"
      },
      {
        "id": "common-problem-sources@afwB90L-q2hIwrA0LtWbG",
        "title": "Common Problem Sources",
        "slug": "common-problem-sources",
        "summary": "In React Native, several common issues can impact application performance. Excessive console logs can slow down the app, particularly in debug mode, so it's advisable to minimize their use and remove unnecessary logs bef",
        "sourcePath": "developer-roadmap/roadmaps/react-native/content/common-problem-sources@afwB90L-q2hIwrA0LtWbG.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/react-native"
  },
  {
    "slug": "redis",
    "title": "Redis",
    "category": "skill",
    "description": "A focused learning path for mastering Redis, with concepts, tools, projects, and next steps.",
    "topicCount": 162,
    "topics": [
      {
        "id": "active-active-geo-distribution@cybF72wlJyJbHLUjitLvn",
        "title": "Active-Active geo Distribution",
        "slug": "active-active-geo-distribution",
        "summary": "An Active-Active architecture is a data resiliency architecture that distributes the database information over multiple data centers via independent and geographically distributed clusters and nodes. It is a network of s",
        "sourcePath": "developer-roadmap/roadmaps/redis/content/active-active-geo-distribution@cybF72wlJyJbHLUjitLvn.md"
      },
      {
        "id": "aof-rewrite--compaction@ibaZ34-laQtUyxAsERi7o",
        "title": "AOF rewrite & compaction",
        "slug": "aof-rewrite--compaction",
        "summary": "Persistence refers to the writing of data to durable storage, such as a solid-state disk (SSD). Redis provides a range of persistence options of which AOF (Append Only File) is one of the options. AOF persistence logs ev",
        "sourcePath": "developer-roadmap/roadmaps/redis/content/aof-rewrite--compaction@ibaZ34-laQtUyxAsERi7o.md"
      },
      {
        "id": "append@cPWd53BO6tm-uy4gqLdtZ",
        "title": "APPEND",
        "slug": "append",
        "summary": "Redis APPEND command is used to add some value in a key. If the key already exists and is a string, this command appends the value at the end of the string. If key does not exist it is created and set as an empty string,",
        "sourcePath": "developer-roadmap/roadmaps/redis/content/append@cPWd53BO6tm-uy4gqLdtZ.md"
      },
      {
        "id": "atomicity-in-redis@jrgaoDnt_RxTu79hk4hCD",
        "title": "Atomicity in Redis",
        "slug": "atomicity-in-redis",
        "summary": "Atomicity in Redis refers to the property that ensures a set of operations is executed as a single, indivisible unit. This means that either all the operations are executed successfully or none of them are. Atomicity is ",
        "sourcePath": "developer-roadmap/roadmaps/redis/content/atomicity-in-redis@jrgaoDnt_RxTu79hk4hCD.md"
      },
      {
        "id": "authentication@Qy42paiTUsO8HIwbWTMui",
        "title": "Authentication",
        "slug": "authentication",
        "summary": "Authentication in Redis is a security feature used to restrict access to the server by requiring clients to authenticate themselves with a password before performing any commands. This helps prevent unauthorized users fr",
        "sourcePath": "developer-roadmap/roadmaps/redis/content/authentication@Qy42paiTUsO8HIwbWTMui.md"
      },
      {
        "id": "backup-and-recovery@wXRDsNGFckXV_CSiit5sN",
        "title": "Backup and Recovery",
        "slug": "backup-and-recovery",
        "summary": "Backing up and recovering Redis data is crucial for ensuring data persistence and reliability. Redis, by default, stores its data in memory for fast access, but it provides mechanisms to persist data to disk to allow for",
        "sourcePath": "developer-roadmap/roadmaps/redis/content/backup-and-recovery@wXRDsNGFckXV_CSiit5sN.md"
      },
      {
        "id": "basic-commands--set-get@NhcZM4nUQoSBBf_1qXi6l",
        "title": "Basic Commands / SET, GET",
        "slug": "basic-commands--set-get",
        "summary": "In Redis, the SET and GET commands are fundamental operations used to store and retrieve key-value pairs. Redis is an in-memory key-value store, and these commands form the basis for working with data in Redis.",
        "sourcePath": "developer-roadmap/roadmaps/redis/content/basic-commands--set-get@NhcZM4nUQoSBBf_1qXi6l.md"
      },
      {
        "id": "batch-operations@7JzeyTrkZ_1_yxMVrqvZU",
        "title": "Batch Operations",
        "slug": "batch-operations",
        "summary": "Batch operations in Redis allow you to execute multiple commands efficiently in a single network round-trip. While Redis does not have true batching like some databases (where a set of operations are sent together and pr",
        "sourcePath": "developer-roadmap/roadmaps/redis/content/batch-operations@7JzeyTrkZ_1_yxMVrqvZU.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/redis"
  },
  {
    "slug": "ruby",
    "title": "Ruby",
    "category": "skill",
    "description": "A focused learning path for mastering Ruby, with concepts, tools, projects, and next steps.",
    "topicCount": 112,
    "topics": [
      {
        "id": "arithmetic@I708SVAEVSpdHzwxoHhgD",
        "title": "Arithmetic Operators",
        "slug": "arithmetic",
        "summary": "Arithmetic operators are symbols that perform mathematical calculations on numerical values. These operators allow you to perform addition, subtraction, multiplication, division, and other common arithmetic operations. T",
        "sourcePath": "developer-roadmap/roadmaps/ruby/content/arithmetic@I708SVAEVSpdHzwxoHhgD.md"
      },
      {
        "id": "arrays@2QHXNKV0tETI5FroFNylt",
        "title": "Arrays",
        "slug": "arrays",
        "summary": "Arrays in Ruby are ordered collections of items. They can hold any type of data, including numbers, strings, symbols, or even other arrays. You create an array using square brackets `[]`, with elements separated by comma",
        "sourcePath": "developer-roadmap/roadmaps/ruby/content/arrays@2QHXNKV0tETI5FroFNylt.md"
      },
      {
        "id": "assignment@NpHLz4I9wwwXX-KBrjdgU",
        "title": "Assignment Operators",
        "slug": "assignment",
        "summary": "Assignment operators in Ruby are used to assign values to variables. The most basic assignment operator is the equals sign (=), which assigns the value on the right-hand side to the variable on the left-hand side. Ruby a",
        "sourcePath": "developer-roadmap/roadmaps/ruby/content/assignment@NpHLz4I9wwwXX-KBrjdgU.md"
      },
      {
        "id": "attributes-accessors@I9dIFxsUrysgrcqUSBNsW",
        "title": "Attributes Accessors",
        "slug": "attributes-accessors",
        "summary": "Attributes accessors provide a convenient way to access and modify the instance variables of a class. They automatically generate methods for reading (getting) and writing (setting) the values of these variables. The thr",
        "sourcePath": "developer-roadmap/roadmaps/ruby/content/attributes-accessors@I9dIFxsUrysgrcqUSBNsW.md"
      },
      {
        "id": "begin-rescue-ensure@-2BSGoXGMMP50en_NnQ97",
        "title": "Exception Handling with begin, rescue, and ensure",
        "slug": "begin-rescue-ensure",
        "summary": "Exception handling is a mechanism to deal with errors that occur during the execution of a program. In Ruby, the `begin`, `rescue`, and `ensure` keywords provide a structured way to handle these exceptions. The `begin` b",
        "sourcePath": "developer-roadmap/roadmaps/ruby/content/begin-rescue-ensure@-2BSGoXGMMP50en_NnQ97.md"
      },
      {
        "id": "blocks@DzolktV1UUCdSWqmqWgV3",
        "title": "Blocks",
        "slug": "blocks",
        "summary": "Blocks are chunks of code that can be passed to methods as if they were arguments. They are defined using either `do...end` or curly braces `{}`. Blocks are not objects themselves, but they can be converted into objects ",
        "sourcePath": "developer-roadmap/roadmaps/ruby/content/blocks@DzolktV1UUCdSWqmqWgV3.md"
      },
      {
        "id": "booleans@Ze02ApxTvyQqtB3VYv3d4",
        "title": "Booleans",
        "slug": "booleans",
        "summary": "Booleans represent truth values: either `true` or `false`. They are fundamental for decision-making in Ruby code, allowing programs to execute different blocks of code based on whether a condition is true or false. Boole",
        "sourcePath": "developer-roadmap/roadmaps/ruby/content/booleans@Ze02ApxTvyQqtB3VYv3d4.md"
      },
      {
        "id": "break@0gjDinuRDgPV9iTm39ZnS",
        "title": "Break Statement in Ruby",
        "slug": "break",
        "summary": "The `break` statement in Ruby is a control flow tool used to exit a loop prematurely. When `break` is encountered within a loop (like `for`, `while`, `until`, or `each`), the loop's execution is immediately terminated, a",
        "sourcePath": "developer-roadmap/roadmaps/ruby/content/break@0gjDinuRDgPV9iTm39ZnS.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/ruby"
  },
  {
    "slug": "ruby-on-rails",
    "title": "Ruby On Rails",
    "category": "skill",
    "description": "A focused learning path for mastering Ruby On Rails, with concepts, tools, projects, and next steps.",
    "topicCount": 109,
    "topics": [
      {
        "id": "accessibility@dvL7HRXMqs2NOuTtfHeXM",
        "title": "Accessibility",
        "slug": "accessibility",
        "summary": "Accessibility, often shortened to A11y, focuses on designing and developing websites and applications that are usable by people with disabilities. This includes individuals with visual, auditory, motor, or cognitive impa",
        "sourcePath": "developer-roadmap/roadmaps/ruby-on-rails/content/accessibility@dvL7HRXMqs2NOuTtfHeXM.md"
      },
      {
        "id": "action-views@NyByCB4J4hk7rN7nrp1dv",
        "title": "Action Views",
        "slug": "action-views",
        "summary": "Action View is the view component of the Ruby on Rails framework. It's responsible for rendering the user interface, typically in HTML, but also in other formats like XML or JSON. It handles tasks such as template render",
        "sourcePath": "developer-roadmap/roadmaps/ruby-on-rails/content/action-views@NyByCB4J4hk7rN7nrp1dv.md"
      },
      {
        "id": "active-record@ig8gCcieQF923NKhNyaNA",
        "title": "Active Record",
        "slug": "active-record",
        "summary": "Active Record is the ORM (Object-Relational Mapping) layer within Ruby on Rails. It acts as an interface between your Ruby code and the database. Instead of writing raw SQL queries, you use Active Record's methods to int",
        "sourcePath": "developer-roadmap/roadmaps/ruby-on-rails/content/active-record@ig8gCcieQF923NKhNyaNA.md"
      },
      {
        "id": "advanced-asset-management@8Jbs2XpIL-Nd-tr2f0AJ8",
        "title": "Advanced Asset Management",
        "slug": "advanced-asset-management",
        "summary": "You can use advanced asset management techniques to optimize and organize your application's assets (images, stylesheets, JavaScript files) beyond the basic functionality provided by the asset pipeline. This includes str",
        "sourcePath": "developer-roadmap/roadmaps/ruby-on-rails/content/advanced-asset-management@8Jbs2XpIL-Nd-tr2f0AJ8.md"
      },
      {
        "id": "aggregations@C8A-30h1xJBFLhD182H89",
        "title": "Aggregations",
        "slug": "aggregations",
        "summary": "Aggregations in Active Record allow you to derive summary information from your database records. This involves performing calculations like finding the average, minimum, maximum, or sum of values across a set of records",
        "sourcePath": "developer-roadmap/roadmaps/ruby-on-rails/content/aggregations@C8A-30h1xJBFLhD182H89.md"
      },
      {
        "id": "app@BiVYxjVr2OhmnglHz_kVZ",
        "title": "App Directory",
        "slug": "app",
        "summary": "The `app` directory in a Rails application is the heart of your project, containing the core logic and components that define its behavior. It's where you'll find the code responsible for handling user requests, interact",
        "sourcePath": "developer-roadmap/roadmaps/ruby-on-rails/content/app@BiVYxjVr2OhmnglHz_kVZ.md"
      },
      {
        "id": "assets-pipeline@EcGyLolDRJJra4PDWlQjJ",
        "title": "Assets Pipeline",
        "slug": "assets-pipeline",
        "summary": "The Assets Pipeline in Rails provides a structured way to manage and pre-process assets like stylesheets, JavaScript files, and images. It bundles, minifies, and compresses these assets to improve website performance by ",
        "sourcePath": "developer-roadmap/roadmaps/ruby-on-rails/content/assets-pipeline@EcGyLolDRJJra4PDWlQjJ.md"
      },
      {
        "id": "authentication@WqjcBTzbU4iFpYVp1-ptv",
        "title": "Authentication",
        "slug": "authentication",
        "summary": "Authentication in Rails verifies the identity of users, ensuring they are who they claim to be before granting access to protected resources. It typically involves checking user credentials, like a username and password,",
        "sourcePath": "developer-roadmap/roadmaps/ruby-on-rails/content/authentication@WqjcBTzbU4iFpYVp1-ptv.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/ruby-on-rails"
  },
  {
    "slug": "rust",
    "title": "Rust",
    "category": "skill",
    "description": "A focused learning path for mastering Rust, with concepts, tools, projects, and next steps.",
    "topicCount": 122,
    "topics": [
      {
        "id": "actix@3Y90v2ysoMcyjDL24H7mC",
        "title": "Actix",
        "slug": "actix",
        "summary": "Actix is a high-performance, pragmatic web framework for Rust built on the actor model. It features powerful middleware, WebSocket support, and excellent performance benchmarks. Actix provides a flexible, feature-rich AP",
        "sourcePath": "developer-roadmap/roadmaps/rust/content/actix@3Y90v2ysoMcyjDL24H7mC.md"
      },
      {
        "id": "arc@yYmV5qkldu0FkDhOhWOXs",
        "title": "Arc",
        "slug": "arc",
        "summary": "`Arc<T>` (Atomic Reference Counting) is a thread-safe smart pointer for sharing immutable data across multiple threads. It uses atomic operations to track reference counts, allowing multiple ownership of heap-allocated d",
        "sourcePath": "developer-roadmap/roadmaps/rust/content/arc@yYmV5qkldu0FkDhOhWOXs.md"
      },
      {
        "id": "array@2DbdHCjFzGHwCUETakaGh",
        "title": "Array",
        "slug": "array",
        "summary": "Arrays are fixed-size collections of elements of the same type stored consecutively in memory. Size must be known at compile time and cannot change. Syntax: `let arr: [type; size] = [elements];`. Example: `let nums: [i32",
        "sourcePath": "developer-roadmap/roadmaps/rust/content/array@2DbdHCjFzGHwCUETakaGh.md"
      },
      {
        "id": "async-std@_2uQInXPdOY-DpYTO1Prt",
        "title": "async-std",
        "slug": "async-std",
        "summary": "`async-std` provides an asynchronous version of Rust's standard library, offering familiar APIs for async programming. It includes its own runtime, task scheduler, and async I/O primitives, designed as a drop-in replacem",
        "sourcePath": "developer-roadmap/roadmaps/rust/content/async-std@_2uQInXPdOY-DpYTO1Prt.md"
      },
      {
        "id": "asynchronous-programming@yu0f5gALho0e8wzV10yow",
        "title": "Asynchronous Programming",
        "slug": "asynchronous-programming",
        "summary": "Async programming in Rust allows executing tasks concurrently rather than sequentially, enabling efficient resource usage especially in IO-heavy applications. Rust provides `async` and `await` keywords: `async` marks fun",
        "sourcePath": "developer-roadmap/roadmaps/rust/content/asynchronous-programming@yu0f5gALho0e8wzV10yow.md"
      },
      {
        "id": "atomic-operations--memory-barriers@n1Epl_nBuoXW2OE0IKYVR",
        "title": "Atomic Operations and Memory Barriers",
        "slug": "atomic-operations--memory-barriers",
        "summary": "Atomic operations provide lock-free concurrency through uninterruptible operations like `load`, `store`, `swap`, and `compare_and_swap`. These low-level primitives enable thread-safe data sharing without locks, forming t",
        "sourcePath": "developer-roadmap/roadmaps/rust/content/atomic-operations--memory-barriers@n1Epl_nBuoXW2OE0IKYVR.md"
      },
      {
        "id": "axum@duQ1RO1lqq793mfb5w31P",
        "title": "Axum",
        "slug": "axum",
        "summary": "Axum is a modern, ergonomic web framework built on hyper and designed for async Rust. It features excellent type safety, powerful extractors, middleware support, and seamless Tokio integration. Axum emphasizes developer ",
        "sourcePath": "developer-roadmap/roadmaps/rust/content/axum@duQ1RO1lqq793mfb5w31P.md"
      },
      {
        "id": "bevy@uyrGki0jB7DXQ0HJe2-vY",
        "title": "bevy",
        "slug": "bevy",
        "summary": "Bevy is a modern, data-driven game engine built in Rust featuring an ECS (Entity Component System) architecture. It supports both 2D and 3D games with modular design, custom shaders, and high performance. Bevy emphasizes",
        "sourcePath": "developer-roadmap/roadmaps/rust/content/bevy@uyrGki0jB7DXQ0HJe2-vY.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/rust"
  },
  {
    "slug": "scala",
    "title": "Scala",
    "category": "skill",
    "description": "A focused learning path for mastering Scala, with concepts, tools, projects, and next steps.",
    "topicCount": 165,
    "topics": [
      {
        "id": "akka--pekko@vsfwt3tvLDhJoRyA82bM1",
        "title": "Akka / Pekko",
        "slug": "akka--pekko",
        "summary": "Akka and Pekko are toolkits for building concurrent, distributed, and resilient applications on the JVM using Scala. Akka, originally developed by Lightbend, introduced an actor model for managing concurrency, inspired b",
        "sourcePath": "developer-roadmap/roadmaps/scala/content/akka--pekko@vsfwt3tvLDhJoRyA82bM1.md"
      },
      {
        "id": "akka--peko-streams@g1CpD832hLdZruCtNf7SX",
        "title": "Akka & Pekko Streams",
        "slug": "akka--peko-streams",
        "summary": "Akka Streams, now succeeded by Pekko Streams, provide a powerful way to handle streams of data reactively and efficiently. These libraries offer tools to define data processing pipelines with backpressure, ensuring that ",
        "sourcePath": "developer-roadmap/roadmaps/scala/content/akka--peko-streams@g1CpD832hLdZruCtNf7SX.md"
      },
      {
        "id": "akka@bXliqiEXUKvqlJ391hHE1",
        "title": "Akka",
        "slug": "akka",
        "summary": "Akka is a suite of modules designed for building scalable, resilient, and distributed systems using the actor model. It simplifies concurrency and fault tolerance by providing a framework for handling asynchronous operat",
        "sourcePath": "developer-roadmap/roadmaps/scala/content/akka@bXliqiEXUKvqlJ391hHE1.md"
      },
      {
        "id": "akkahttp@82TpZ2W8LJBEEEjTo8_kD",
        "title": "Akka HTTP",
        "slug": "akkahttp",
        "summary": "Akka HTTP is a modern, fast, asynchronous, and streaming-first HTTP server and client. It implements a full server- and client-side HTTP stack on top of akka-actor and akka-stream. Akka HTTP is not a web framework but ra",
        "sourcePath": "developer-roadmap/roadmaps/scala/content/akkahttp@82TpZ2W8LJBEEEjTo8_kD.md"
      },
      {
        "id": "anonymous-func--lambda@jkV_FWlv79nxyNiT_WFOr",
        "title": "Anonymous Functions / Lambdas",
        "slug": "anonymous-func--lambda",
        "summary": "Anonymous functions, also known as lambdas, are functions without names. You define them inline where you need them, typically to pass them as arguments to other functions. They're essentially a concise way to represent ",
        "sourcePath": "developer-roadmap/roadmaps/scala/content/anonymous-func--lambda@jkV_FWlv79nxyNiT_WFOr.md"
      },
      {
        "id": "apply-method@v6KrScCfuNH8i1aTBGVI4",
        "title": "The apply method",
        "slug": "apply-method",
        "summary": "The apply function is a so-called smart constructor. It's the most popular way in Scala to create new instances of data types. It's more flexible than a standard constructor because it allows for running certain logic be",
        "sourcePath": "developer-roadmap/roadmaps/scala/content/apply-method@v6KrScCfuNH8i1aTBGVI4.md"
      },
      {
        "id": "array@D_2hxCGaYnaQf1Tu0Y-ty",
        "title": "Array",
        "slug": "array",
        "summary": "An array is a fixed-size data structure that stores elements of the same data type. Arrays in Scala are mutable, meaning their elements can be updated. Arrays provide fast and constant-time access to elements based on th",
        "sourcePath": "developer-roadmap/roadmaps/scala/content/array@D_2hxCGaYnaQf1Tu0Y-ty.md"
      },
      {
        "id": "backend@RpAAmXmhMgIhuzgRBFcPj",
        "title": "Backend",
        "slug": "backend",
        "summary": "Backend software development in the context of programming in Scala involves creating and maintaining the server-side components of applications that handle business logic, data processing, and communication with databas",
        "sourcePath": "developer-roadmap/roadmaps/scala/content/backend@RpAAmXmhMgIhuzgRBFcPj.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/scala"
  },
  {
    "slug": "server-side-game-developer",
    "title": "Server Side Game Developer",
    "category": "role",
    "description": "A practical path for becoming a stronger Server Side Game Developer practitioner, from fundamentals to production-ready work.",
    "topicCount": 156,
    "topics": [
      {
        "id": "actor-model@KUQEgHldZPOLwFoXqQ2vM",
        "title": "Actor Model",
        "slug": "actor-model",
        "summary": "The **Actor Model** is a conceptual model to deal with concurrent computation. It defines some general rules for how the system's components should behave and interact with each other. In the Actor Model, each object (ac",
        "sourcePath": "developer-roadmap/roadmaps/server-side-game-developer/content/actor-model@KUQEgHldZPOLwFoXqQ2vM.md"
      },
      {
        "id": "address-conversion@SBA7pa9o0AM0ZEBepd7UM",
        "title": "Address Conversion",
        "slug": "address-conversion",
        "summary": "In socket programming, address conversion functions are important for handling internet addresses. Functions like `inet_pton()` (presentation to network) and `inet_ntop()` (network to presentation) are frequently used. `",
        "sourcePath": "developer-roadmap/roadmaps/server-side-game-developer/content/address-conversion@SBA7pa9o0AM0ZEBepd7UM.md"
      },
      {
        "id": "ai@dkCVwuy8GKeEi3VJar_Zo",
        "title": "AI",
        "slug": "ai",
        "summary": "Artificial Intelligence (AI) in server side game development refers to the use of algorithms and computational procedures to create systems capable of performing tasks that would require human intelligence. Such tasks in",
        "sourcePath": "developer-roadmap/roadmaps/server-side-game-developer/content/ai@dkCVwuy8GKeEi3VJar_Zo.md"
      },
      {
        "id": "akka-java@eAEpEUVZcSKO9uCIlMN5y",
        "title": "Akka (Java)",
        "slug": "akka-java",
        "summary": "Akka is an open-source toolkit and runtime simplifying the construction of concurrent and distributed applications on the JVM. It implements the Actor Model for handling concurrency, allowing developers to create systems",
        "sourcePath": "developer-roadmap/roadmaps/server-side-game-developer/content/akka-java@eAEpEUVZcSKO9uCIlMN5y.md"
      },
      {
        "id": "akknet-c@SsOz9Pj6Jc_55PgpmziL6",
        "title": "Akka.net (C#)",
        "slug": "akknet-c",
        "summary": "\"Akka.NET\" is a toolkit and a runtime for designing concurrent and distributed applications. This technology is directly inspired by the Actor Model concept, implementing its principles to create robust and highly functi",
        "sourcePath": "developer-roadmap/roadmaps/server-side-game-developer/content/akknet-c@SsOz9Pj6Jc_55PgpmziL6.md"
      },
      {
        "id": "amazon-ml@U0RlO_puezQPZP0-iBXgW",
        "title": "Amazon ML",
        "slug": "amazon-ml",
        "summary": "Amazon Machine Learning (Amazon ML) is a robust, cloud-based service that makes it easy for developers of all skill levels to use machine learning technology. It provides visualization tools and wizards that guide you th",
        "sourcePath": "developer-roadmap/roadmaps/server-side-game-developer/content/amazon-ml@U0RlO_puezQPZP0-iBXgW.md"
      },
      {
        "id": "apache-kafka@gL7hubTh3qiMyUWeAZNwI",
        "title": "Apache Kafka",
        "slug": "apache-kafka",
        "summary": "Apache Kafka is an open-source stream-processing software platform developed by LinkedIn and donated to the Apache Software Foundation. It is written in Scala and Java and operates based on a message queue, designed to h",
        "sourcePath": "developer-roadmap/roadmaps/server-side-game-developer/content/apache-kafka@gL7hubTh3qiMyUWeAZNwI.md"
      },
      {
        "id": "apache-spark@yrWiWJMSyTWxDakJbqacu",
        "title": "Apache Spark",
        "slug": "apache-spark",
        "summary": "Apache Spark is an open-source, distributed computing system used for big data processing and analytics. It offers an interface for programming entire clusters with impeccable data parallelism and fault tolerance. With i",
        "sourcePath": "developer-roadmap/roadmaps/server-side-game-developer/content/apache-spark@yrWiWJMSyTWxDakJbqacu.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/server-side-game-developer"
  },
  {
    "slug": "shell-bash",
    "title": "Shell / Bash",
    "category": "skill",
    "description": "A focused learning path for mastering Shell / Bash, with concepts, tools, projects, and next steps.",
    "topicCount": 174,
    "topics": [
      {
        "id": "0@pgZIDDxAP9mOtEI0HL3l-",
        "title": "$0 in Shell Scripting",
        "slug": "0",
        "summary": "In shell scripting, `$0` is a special variable that holds the name of the script being executed. It essentially represents the command used to invoke the script. This can be the script's filename, or if the script was in",
        "sourcePath": "developer-roadmap/roadmaps/shell-bash/content/0@pgZIDDxAP9mOtEI0HL3l-.md"
      },
      {
        "id": "1-2-3@DiYuY3M3eD1WKO5w16Swa",
        "title": "Positional Parameters",
        "slug": "1-2-3",
        "summary": "Positional parameters in shell scripting are variables that hold the command-line arguments passed to a script. These parameters are represented by special variables like `$1`, `$2`, `$3`, and so on, where each number co",
        "sourcePath": "developer-roadmap/roadmaps/shell-bash/content/1-2-3@DiYuY3M3eD1WKO5w16Swa.md"
      },
      {
        "id": "@2Fh0NFuNxuc-wU3VXv8Zj",
        "title": "$*",
        "slug": "",
        "summary": "`$*` is a special variable in shell scripting that expands to all the positional parameters (arguments) passed to a script or function. It represents all the arguments as a single string, with each argument separated by ",
        "sourcePath": "developer-roadmap/roadmaps/shell-bash/content/@2Fh0NFuNxuc-wU3VXv8Zj.md"
      },
      {
        "id": "@Pr8XdVGYBIuCyRW4w45sa",
        "title": "Square Bracket Wildcards in Shell/Bash",
        "slug": "",
        "summary": "Square brackets `[]` in shell wildcards define a character class, matching any single character _within_ the brackets. This allows you to specify a range or set of characters to match in a filename or string. For example",
        "sourcePath": "developer-roadmap/roadmaps/shell-bash/content/@Pr8XdVGYBIuCyRW4w45sa.md"
      },
      {
        "id": "@VLzMSaoVA46PTLHwZtDUx",
        "title": "Script Arguments using $@",
        "slug": "",
        "summary": "`$@` is a special variable in shell scripting that expands to all the positional parameters (arguments) passed to a script. Each argument is treated as a separate word, even if it contains spaces, ensuring that the scrip",
        "sourcePath": "developer-roadmap/roadmaps/shell-bash/content/@VLzMSaoVA46PTLHwZtDUx.md"
      },
      {
        "id": "@X6aVYPapBn-EC9Dw6LMDB",
        "title": "Asterisk Wildcard",
        "slug": "",
        "summary": "The asterisk (\\*) is a wildcard character that represents zero or more characters. It's used in commands and file paths to match multiple files or directories based on a pattern. For example, `*.txt` will match all files",
        "sourcePath": "developer-roadmap/roadmaps/shell-bash/content/@X6aVYPapBn-EC9Dw6LMDB.md"
      },
      {
        "id": "@hoRtqMV7B23bBJFI-RWRB",
        "title": "Number of Script Arguments ($#)",
        "slug": "",
        "summary": "`$#` is a special variable in shell scripting that represents the number of arguments passed to a script when it is executed. It's a simple integer value that allows you to determine how many inputs the user provided whe",
        "sourcePath": "developer-roadmap/roadmaps/shell-bash/content/@hoRtqMV7B23bBJFI-RWRB.md"
      },
      {
        "id": "@hxjqlxolS_ahtro4T0EKG",
        "title": "Exit Codes and $?",
        "slug": "",
        "summary": "Exit codes are numerical values returned by a program or script upon completion, signaling whether it executed successfully or encountered an error. The special variable `$?` in Bash stores the exit code of the most rece",
        "sourcePath": "developer-roadmap/roadmaps/shell-bash/content/@hxjqlxolS_ahtro4T0EKG.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/shell-bash"
  },
  {
    "slug": "software-architect",
    "title": "Software Architect",
    "category": "role",
    "description": "A practical path for becoming a stronger Software Architect practitioner, from fundamentals to production-ready work.",
    "topicCount": 112,
    "topics": [
      {
        "id": "acid-cap-theorem@bbKEEk7dvfFZBBJaIjm0j",
        "title": "ACID, CAP Theorem",
        "slug": "acid-cap-theorem",
        "summary": "ACID describes the guarantees a database transaction provides: atomicity, consistency, isolation, and durability, ensuring reliable operations even under failure. The CAP theorem states that a distributed system can only",
        "sourcePath": "developer-roadmap/roadmaps/software-architect/content/acid-cap-theorem@bbKEEk7dvfFZBBJaIjm0j.md"
      },
      {
        "id": "actors@AoWO2BIKG5X4JWir6kh5r",
        "title": "Actors",
        "slug": "actors",
        "summary": "Actor Model is a model that represents actors as the basic unit of a system, they can only communicate through messages and have their own private state, and they can also manage other actors, resulting in an encapsulate",
        "sourcePath": "developer-roadmap/roadmaps/software-architect/content/actors@AoWO2BIKG5X4JWir6kh5r.md"
      },
      {
        "id": "apache-spark@a0baFv7hVWZGvS5VLh5ig",
        "title": "Apache spark",
        "slug": "apache-spark",
        "summary": "Apache Spark is a distributed data processing engine that performs computations in memory, making it significantly faster than earlier tools like MapReduce for many workloads. It supports batch processing, streaming, mac",
        "sourcePath": "developer-roadmap/roadmaps/software-architect/content/apache-spark@a0baFv7hVWZGvS5VLh5ig.md"
      },
      {
        "id": "apis--integrations@Ocn7-ctpnl71ZCZ_uV-uD",
        "title": "APIs and Integrations",
        "slug": "apis--integrations",
        "summary": "APIs and integrations define how different systems and services communicate with each other, whether within a company or across organizations. Choosing the right integration style, protocol, and data format affects perfo",
        "sourcePath": "developer-roadmap/roadmaps/software-architect/content/apis--integrations@Ocn7-ctpnl71ZCZ_uV-uD.md"
      },
      {
        "id": "application-architecture@Lqe47l4j-C4OwkbkwPYry",
        "title": "Application Architecture",
        "slug": "application-architecture",
        "summary": "Application architecture focuses on the internal structure of a single software application: its modules, layers, and the patterns used to organize code. It determines how the application handles concerns like data acces",
        "sourcePath": "developer-roadmap/roadmaps/software-architect/content/application-architecture@Lqe47l4j-C4OwkbkwPYry.md"
      },
      {
        "id": "architecture@OaLmlfkZid7hKqJ9G8oNV",
        "title": "Architectures",
        "slug": "architecture",
        "summary": "Architecture refers to the approach of designing and implementing software architecture with a focus on the tools and technologies that will be used during the development process. This perspective emphasizes that the se",
        "sourcePath": "developer-roadmap/roadmaps/software-architect/content/architecture@OaLmlfkZid7hKqJ9G8oNV.md"
      },
      {
        "id": "atlassian-tools@3bpd0iZTd3G-H8A7yrExY",
        "title": "Atlassian Tools",
        "slug": "atlassian-tools",
        "summary": "Atlassian tools, including Jira and Confluence, support project tracking and documentation for software teams at scale. Jira manages tasks, sprints, and issues in agile workflows, while Confluence stores documentation an",
        "sourcePath": "developer-roadmap/roadmaps/software-architect/content/atlassian-tools@3bpd0iZTd3G-H8A7yrExY.md"
      },
      {
        "id": "auth-strategies@KiwFXB6yd0go30zAFMTJt",
        "title": "Auth Strategies",
        "slug": "auth-strategies",
        "summary": "Authentication and authorization strategies determine how a system verifies who a user is and what they are allowed to do. Common approaches include session based authentication, token based methods like JWT, and protoco",
        "sourcePath": "developer-roadmap/roadmaps/software-architect/content/auth-strategies@KiwFXB6yd0go30zAFMTJt.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/software-architect"
  },
  {
    "slug": "spring-boot",
    "title": "Spring Boot",
    "category": "skill",
    "description": "A focused learning path for mastering Spring Boot, with concepts, tools, projects, and next steps.",
    "topicCount": 46,
    "topics": [
      {
        "id": "actuators@N7hd3d_XQtvOgnCqdCFt3",
        "title": "Actuators",
        "slug": "actuators",
        "summary": "Spring Boot Actuators are a set of production-ready features in Spring Boot that allow you to monitor and manage your application in various ways. They provide a variety of endpoints that expose information about the hea",
        "sourcePath": "developer-roadmap/roadmaps/spring-boot/content/actuators@N7hd3d_XQtvOgnCqdCFt3.md"
      },
      {
        "id": "annotations@HdCpfGMrMaXxk5QrtYn3X",
        "title": "Annotations",
        "slug": "annotations",
        "summary": "One of the key features of Spring Boot is its use of annotations, which are used to configure various aspects of the application and to enable certain features.",
        "sourcePath": "developer-roadmap/roadmaps/spring-boot/content/annotations@HdCpfGMrMaXxk5QrtYn3X.md"
      },
      {
        "id": "architecture@_vS_zdJZegZS6MIKAFyg8",
        "title": "Architecture",
        "slug": "architecture",
        "summary": "The Spring MVC (Model-View-Controller) is a web application framework that is part of the Spring Framework. It is designed to make it easy to build web applications using the MVC design pattern.",
        "sourcePath": "developer-roadmap/roadmaps/spring-boot/content/architecture@_vS_zdJZegZS6MIKAFyg8.md"
      },
      {
        "id": "architecture@yuXN-rD4AyyPYUYOR50L_",
        "title": "Architecture",
        "slug": "architecture",
        "summary": "Spring Boot follows a layered architecture in which each layer communicates with the layer directly below or above (hierarchical structure) it. The four layers in Spring Boot are as follows:",
        "sourcePath": "developer-roadmap/roadmaps/spring-boot/content/architecture@yuXN-rD4AyyPYUYOR50L_.md"
      },
      {
        "id": "authentication@ssdk2iAt4avhc8B5tnIzQ",
        "title": "Authentication",
        "slug": "authentication",
        "summary": "Spring Security is a framework for securing Java-based applications. One of its core features is authentication, which is the process of verifying that a user is who they claim to be. Spring Security provides a wide rang",
        "sourcePath": "developer-roadmap/roadmaps/spring-boot/content/authentication@ssdk2iAt4avhc8B5tnIzQ.md"
      },
      {
        "id": "authorization@c7w7Z3Coa81FKa_yAKTse",
        "title": "Authorization",
        "slug": "authorization",
        "summary": "Spring Security supports a variety of authentication mechanisms, such as username and password authentication, OAuth2, and more. Once a user is authenticated, Spring Security can then be used to authorize that user's acc",
        "sourcePath": "developer-roadmap/roadmaps/spring-boot/content/authorization@c7w7Z3Coa81FKa_yAKTse.md"
      },
      {
        "id": "autoconfiguration@88-h3d7kb-VmUBsnUUXW_",
        "title": "Autoconfiguration",
        "slug": "autoconfiguration",
        "summary": "Spring Boot's Autoconfiguration is a powerful and convenient feature that makes it easy to configure beans and other components in your application based on the presence of certain dependencies and properties. It saves d",
        "sourcePath": "developer-roadmap/roadmaps/spring-boot/content/autoconfiguration@88-h3d7kb-VmUBsnUUXW_.md"
      },
      {
        "id": "cloud-config@9hG3CB8r41bUb_s8-0u73",
        "title": "Cloud Config",
        "slug": "cloud-config",
        "summary": "Spring Cloud Config is a library for managing configuration properties for distributed applications. It allows developers to externalize configuration properties for an application, so that they can be easily changed wit",
        "sourcePath": "developer-roadmap/roadmaps/spring-boot/content/cloud-config@9hG3CB8r41bUb_s8-0u73.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/spring-boot"
  },
  {
    "slug": "swift-ui",
    "title": "Swift & Swift UI",
    "category": "skill",
    "description": "A focused learning path for mastering Swift & Swift UI, with concepts, tools, projects, and next steps.",
    "topicCount": 156,
    "topics": [
      {
        "id": "access-control@SRZfkrqxU2UxFif4v4t3o",
        "title": "Access Control",
        "slug": "access-control",
        "summary": "Access control lets you restrict which parts of your code can be used and accessed by other parts of your code, or from code in other files and modules. It's like setting permissions on different components of your app, ",
        "sourcePath": "developer-roadmap/roadmaps/swift-ui/content/access-control@SRZfkrqxU2UxFif4v4t3o.md"
      },
      {
        "id": "accessibility@-u5-uN2x0uuvkLieoq7Nr",
        "title": "Accessibility",
        "slug": "accessibility",
        "summary": "Accessibility focuses on making your app usable by everyone, including people with disabilities. This involves providing alternative ways to interact with your app's content and controls, such as using screen readers, sw",
        "sourcePath": "developer-roadmap/roadmaps/swift-ui/content/accessibility@-u5-uN2x0uuvkLieoq7Nr.md"
      },
      {
        "id": "actors@sZeSwx_Rb0H81oA7KUw9m",
        "title": "Actors",
        "slug": "actors",
        "summary": "Actors are a concurrency model that provides a way to isolate state and prevent data races in concurrent Swift programs. They encapsulate mutable state and allow access to that state only through asynchronous message pas",
        "sourcePath": "developer-roadmap/roadmaps/swift-ui/content/actors@sZeSwx_Rb0H81oA7KUw9m.md"
      },
      {
        "id": "alamofire@47Sc0VzbRMKYb-3ivhNG3",
        "title": "Alamofire",
        "slug": "alamofire",
        "summary": "Alamofire is a Swift-based HTTP networking library that simplifies the process of making network requests in your iOS, macOS, tvOS, and watchOS applications. It provides an elegant interface built on top of Apple's `URLS",
        "sourcePath": "developer-roadmap/roadmaps/swift-ui/content/alamofire@47Sc0VzbRMKYb-3ivhNG3.md"
      },
      {
        "id": "animatable-protocol@gktNK5eNvTJ3vqmPdHYCC",
        "title": "Animatable Protocol",
        "slug": "animatable-protocol",
        "summary": "The `Animatable` protocol allows you to customize how changes to your custom data types are animated in SwiftUI. By conforming to this protocol, you define a `var animatableData: Self.AnimatableData` property that SwiftU",
        "sourcePath": "developer-roadmap/roadmaps/swift-ui/content/animatable-protocol@gktNK5eNvTJ3vqmPdHYCC.md"
      },
      {
        "id": "animations@Ui6hCqvVwf61wXBOxYG6Q",
        "title": "Animations",
        "slug": "animations",
        "summary": "Animations allow you to visually enhance your app's user interface by creating smooth transitions and dynamic effects. They involve changing properties of views over time, making your app feel more responsive and engagin",
        "sourcePath": "developer-roadmap/roadmaps/swift-ui/content/animations@Ui6hCqvVwf61wXBOxYG6Q.md"
      },
      {
        "id": "app-architecture@UCv-FDzB1O-zRH700Im8i",
        "title": "App Architecture",
        "slug": "app-architecture",
        "summary": "App architecture is the structural design of an application, defining its components, their relationships, and how they interact to achieve the app's functionality. It provides a blueprint for organizing code, managing d",
        "sourcePath": "developer-roadmap/roadmaps/swift-ui/content/app-architecture@UCv-FDzB1O-zRH700Im8i.md"
      },
      {
        "id": "app-lifecycle@FfREh4vs6KqWEUQ44pDmA",
        "title": "App Lifecycle",
        "slug": "app-lifecycle",
        "summary": "The app lifecycle manages the state and behavior of your application from launch to termination. It's primarily handled through the `@main` attribute, which designates the entry point of your app. The `App` protocol defi",
        "sourcePath": "developer-roadmap/roadmaps/swift-ui/content/app-lifecycle@FfREh4vs6KqWEUQ44pDmA.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/swift-ui"
  },
  {
    "slug": "technical-writer",
    "title": "Technical Writer",
    "category": "role",
    "description": "A practical path for becoming a stronger Technical Writer practitioner, from fundamentals to production-ready work.",
    "topicCount": 84,
    "topics": [
      {
        "id": "api-definitions@co-35BsWMrD6PXohpFqba",
        "title": "API Definitions",
        "slug": "api-definitions",
        "summary": "API stands for Application Programming Interface. Essentially, it's a set of rules and protocols for building and integrating application software. APIs allow different software programs to communicate with each other, a",
        "sourcePath": "developer-roadmap/roadmaps/technical-writer/content/api-definitions@co-35BsWMrD6PXohpFqba.md"
      },
      {
        "id": "api-reference@z5_73Q7dWbBd4m_OrdZlH",
        "title": "API Reference",
        "slug": "api-reference",
        "summary": "API References are comprehensive guides designed to understand the details of the API. Usually, they include information such as endpoints, request examples, response types and examples, and error codes. API References h",
        "sourcePath": "developer-roadmap/roadmaps/technical-writer/content/api-reference@z5_73Q7dWbBd4m_OrdZlH.md"
      },
      {
        "id": "awareness-blog-posts@7S2lymeBZSMBZSsmei7us",
        "title": "Awareness Blog Posts",
        "slug": "awareness-blog-posts",
        "summary": "\"Awareness blogs\" is a commonly used term in digital marketing, particularly concerning \"top funnel\" strategies. As the phrase implies, these blogs are designed to create, increase, or maintain awareness of a particular ",
        "sourcePath": "developer-roadmap/roadmaps/technical-writer/content/awareness-blog-posts@7S2lymeBZSMBZSsmei7us.md"
      },
      {
        "id": "backlinking@UphVii3y4T_PkRMqFJ4r_",
        "title": "Backlinking",
        "slug": "backlinking",
        "summary": "Backlinking, often referred as \"inbound links\" or \"incoming links\", is a method used in search engine optimization (SEO) where other websites link to your content. Backlinks are significant indicators of content's releva",
        "sourcePath": "developer-roadmap/roadmaps/technical-writer/content/backlinking@UphVii3y4T_PkRMqFJ4r_.md"
      },
      {
        "id": "best-practices@yYLsG2LuPaNUuhXSVev_0",
        "title": "Best Practices",
        "slug": "best-practices",
        "summary": "As a technical writer, adhering to established best practices helps to ensure the consistency, clarity, and overall quality of your work. Some common best practices include:",
        "sourcePath": "developer-roadmap/roadmaps/technical-writer/content/best-practices@yYLsG2LuPaNUuhXSVev_0.md"
      },
      {
        "id": "blogging-platforms@sdoFe4A3y_-Zp3mlrJ5r8",
        "title": "Blogging Platforms",
        "slug": "blogging-platforms",
        "summary": "\"Blogging Platforms\" refers to software services that allow users to create, post, and manage blogs online. Some well-known examples of blogging platforms include WordPress, Blogger, Tumblr, and Medium. These platforms o",
        "sourcePath": "developer-roadmap/roadmaps/technical-writer/content/blogging-platforms@sdoFe4A3y_-Zp3mlrJ5r8.md"
      },
      {
        "id": "bottom-funnel-content@vo1udIIRpxNZCpA3g32F3",
        "title": "Bottom-funnel Content",
        "slug": "bottom-funnel-content",
        "summary": "\"Bottom funnel\" refers to the final stage in the marketing funnel where potential customers are ready to make a purchase. This phase typically includes actions like negotiations, sales calls, and the final transaction. F",
        "sourcePath": "developer-roadmap/roadmaps/technical-writer/content/bottom-funnel-content@vo1udIIRpxNZCpA3g32F3.md"
      },
      {
        "id": "buyer-journey--content-funnel@EhhKxYPtoLztZXBXl3ZGl",
        "title": "Buyer Journey and Content Funnel",
        "slug": "buyer-journey--content-funnel",
        "summary": "The **Buyer Journey** refers to the process a customer goes through from the moment they become aware of a need or desire until the point of purchase. It is often categorized into three main stages: Awareness, Considerat",
        "sourcePath": "developer-roadmap/roadmaps/technical-writer/content/buyer-journey--content-funnel@EhhKxYPtoLztZXBXl3ZGl.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/technical-writer"
  },
  {
    "slug": "terraform",
    "title": "Terraform",
    "category": "skill",
    "description": "A focused learning path for mastering Terraform, with concepts, tools, projects, and next steps.",
    "topicCount": 110,
    "topics": [
      {
        "id": "-replace-option-in-apply@jvHtSRLuCXJrGIiesgbE-",
        "title": "-replace option in apply",
        "slug": "-replace-option-in-apply",
        "summary": "The `-replace` flag in Terraform is used with the apply or plan command to force the replacement of a specific resource by tainting the resources. This flag instructs Terraform to delete and recreate the specified resour",
        "sourcePath": "developer-roadmap/roadmaps/terraform/content/-replace-option-in-apply@jvHtSRLuCXJrGIiesgbE-.md"
      },
      {
        "id": "authentication@RPcsyhIG027uP7KF0hwaY",
        "title": "Authentication",
        "slug": "authentication",
        "summary": "HCP (HashiCorp Cloud Platform) authentication provides secure access management for its services, including Terraform Cloud. It utilizes a comprehensive identity and access management system that supports multiple authen",
        "sourcePath": "developer-roadmap/roadmaps/terraform/content/authentication@RPcsyhIG027uP7KF0hwaY.md"
      },
      {
        "id": "basic-syntax@LaD0H7XhoEEaXbcwjxAbw",
        "title": "Basic Syntax",
        "slug": "basic-syntax",
        "summary": "The Basic Syntax of HashiCorp Configuration Language (HCL) includes defining blocks, attributes, and expressions. Blocks are fundamental units like `resource`, `module`, and `provider`, identified by keywords and enclose",
        "sourcePath": "developer-roadmap/roadmaps/terraform/content/basic-syntax@LaD0H7XhoEEaXbcwjxAbw.md"
      },
      {
        "id": "best-practices-for-state@jas0XILqCUXjWRk3ZoSEO",
        "title": "Best Practices for State",
        "slug": "best-practices-for-state",
        "summary": "Terraform state best practices focus on security, consistency, and collaboration.",
        "sourcePath": "developer-roadmap/roadmaps/terraform/content/best-practices-for-state@jas0XILqCUXjWRk3ZoSEO.md"
      },
      {
        "id": "cac-vs-iac@UsINvx84pBF1hp8XoLF4c",
        "title": "CaC vs IaC",
        "slug": "cac-vs-iac",
        "summary": "CaC (Configuration as Code) and IaC (Infrastructure as Code) are both ways to manage infrastructure resources, but they focus on different things. CaC deals with setting up and managing the software and settings within y",
        "sourcePath": "developer-roadmap/roadmaps/terraform/content/cac-vs-iac@UsINvx84pBF1hp8XoLF4c.md"
      },
      {
        "id": "checkov@ljj7ngl1N4ezCXQ0o6Y8x",
        "title": "Checkov",
        "slug": "checkov",
        "summary": "Checkov is an open-source static code analysis tool designed for scanning Infrastructure as Code (IaC) files, including Terraform configurations, for security and compliance issues. It provides a comprehensive set of out",
        "sourcePath": "developer-roadmap/roadmaps/terraform/content/checkov@ljj7ngl1N4ezCXQ0o6Y8x.md"
      },
      {
        "id": "ci--cd-integration@O194eWh529jj4VDhKxNSj",
        "title": "CI / CD Integration",
        "slug": "ci--cd-integration",
        "summary": "CI/CD integration with Terraform involves incorporating infrastructure-as-code practices into continuous integration and continuous deployment pipelines. This integration automates the process of planning, validating, an",
        "sourcePath": "developer-roadmap/roadmaps/terraform/content/ci--cd-integration@O194eWh529jj4VDhKxNSj.md"
      },
      {
        "id": "circle-ci@6OoAdvikyp0byMH2oZhyQ",
        "title": "Circle CI",
        "slug": "circle-ci",
        "summary": "Integrating Terraform with CircleCI enables automated infrastructure management within CircleCI's continuous integration and deployment pipelines. This setup allows for consistent and repeatable infrastructure deployment",
        "sourcePath": "developer-roadmap/roadmaps/terraform/content/circle-ci@6OoAdvikyp0byMH2oZhyQ.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/terraform"
  },
  {
    "slug": "ux-design",
    "title": "UX Design",
    "category": "role",
    "description": "A practical path for becoming a stronger UX Design practitioner, from fundamentals to production-ready work.",
    "topicCount": 94,
    "topics": [
      {
        "id": "adobe-xd@HI_urBhPqT0m3AeBQJIej",
        "title": "Adobe XD",
        "slug": "adobe-xd",
        "summary": "Adobe XD (Experience Design) is a powerful design and prototyping tool that allows UX designers to create wireframes, mockups, and interactive prototypes for various digital projects. It is available for both Mac and Win",
        "sourcePath": "developer-roadmap/roadmaps/ux-design/content/adobe-xd@HI_urBhPqT0m3AeBQJIej.md"
      },
      {
        "id": "automate-the-act-of-repetition@ZufrLRNkMoJ4e2T-vWxCR",
        "title": "Automate the Act of Repetition",
        "slug": "automate-the-act-of-repetition",
        "summary": "Automating repetition removes the user from having to repeat an action manually once it has been done or approved once. Recurring subscriptions, auto-renewals, and scheduled backups are examples where the system takes ov",
        "sourcePath": "developer-roadmap/roadmaps/ux-design/content/automate-the-act-of-repetition@ZufrLRNkMoJ4e2T-vWxCR.md"
      },
      {
        "id": "avoid-choice-overload@8wxlu4KA2iu9CJa1UAUll",
        "title": "Avoid Direct Payments",
        "slug": "avoid-choice-overload",
        "summary": "Avoiding direct payments means reducing the visible friction of parting with money, for example by using stored credit, points, or a saved card instead of asking users to re-enter payment details each time. Research show",
        "sourcePath": "developer-roadmap/roadmaps/ux-design/content/avoid-choice-overload@8wxlu4KA2iu9CJa1UAUll.md"
      },
      {
        "id": "avoid-cognitive-overhead@4AzPOKXUN32CkgchRMrRY",
        "title": "Avoid Cognitive Overhead",
        "slug": "avoid-cognitive-overhead",
        "summary": "Cognitive overhead refers to the mental effort needed to understand or operate a given system, tool, or interface. In UX design, it is crucial to minimize cognitive overhead to create user-friendly and efficient experien",
        "sourcePath": "developer-roadmap/roadmaps/ux-design/content/avoid-cognitive-overhead@4AzPOKXUN32CkgchRMrRY.md"
      },
      {
        "id": "avoid-direct-payments@iQNvKhwhvbis4Yn1ZxQua",
        "title": "Avoid Direct Payments",
        "slug": "avoid-direct-payments",
        "summary": "Avoiding direct payments is a crucial aspect of UX design that can lead to favorable conscious evaluations from users. Direct payments refer to instances where users are required to pay for your product or service upfron",
        "sourcePath": "developer-roadmap/roadmaps/ux-design/content/avoid-direct-payments@iQNvKhwhvbis4Yn1ZxQua.md"
      },
      {
        "id": "balsamiq@fZkARg6kPXPemYW1vDMTe",
        "title": "Balsamiq",
        "slug": "balsamiq",
        "summary": "Balsamiq is a popular wireframing tool that helps designers, developers, and product managers to quickly create and visualize user interfaces, web pages, or app screens. It's an easy-to-use software that allows you to fo",
        "sourcePath": "developer-roadmap/roadmaps/ux-design/content/balsamiq@fZkARg6kPXPemYW1vDMTe.md"
      },
      {
        "id": "be-authentic-and-personal@m30ePaw_qa36m9Rv9NSFf",
        "title": "Be Authentic and Personal",
        "slug": "be-authentic-and-personal",
        "summary": "When creating a user experience (UX) design, it's essential to be authentic and personal. This means that your design should be genuine, truthful, and relatable to your users. By being authentic and personal, you can cre",
        "sourcePath": "developer-roadmap/roadmaps/ux-design/content/be-authentic-and-personal@m30ePaw_qa36m9Rv9NSFf.md"
      },
      {
        "id": "behavior-change-games@JSBiw0C6aq1LhA33y79PM",
        "title": "Behavior Change Games",
        "slug": "behavior-change-games",
        "summary": "Behavior change games are a powerful UX design pattern that help users adopt new habits or make positive lifestyle changes. These games are typically designed to be engaging, enjoyable, and motivating, utilizing various ",
        "sourcePath": "developer-roadmap/roadmaps/ux-design/content/behavior-change-games@JSBiw0C6aq1LhA33y79PM.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/ux-design"
  },
  {
    "slug": "vibe-coding",
    "title": "Vibe Coding",
    "category": "skill",
    "description": "A focused learning path for mastering Vibe Coding, with concepts, tools, projects, and next steps.",
    "topicCount": 54,
    "topics": [
      {
        "id": "ask-ai-to-handle-your-git-and-github-cli-tasks@vDSSzh5TwZ8zzY0rWRXu4",
        "title": "Ask AI to handle your Git and GitHub CLI tasks",
        "slug": "ask-ai-to-handle-your-git-and-github-cli-tasks",
        "summary": "You don't need to memorize Git commands. Ask AI to write commit messages, create branches, push code, and manage your repository for you. This removes one of the biggest barriers beginners face with version control and k",
        "sourcePath": "developer-roadmap/roadmaps/vibe-coding/content/ask-ai-to-handle-your-git-and-github-cli-tasks@vDSSzh5TwZ8zzY0rWRXu4.md"
      },
      {
        "id": "ask-ai-to-keep-the-code-modular-and-aim-for-smaller-modulesfiles@FoQ15wo0cV2Tntru6jV-1",
        "title": "Ask AI to keep the code modular and aim for smaller modules/files",
        "slug": "ask-ai-to-keep-the-code-modular-and-aim-for-smaller-modulesfiles",
        "summary": "From the start, tell AI to split the code into small, focused files rather than putting everything in one place. Smaller files are easier to read, easier to fix, and easier for AI to work with in future sessions without ",
        "sourcePath": "developer-roadmap/roadmaps/vibe-coding/content/ask-ai-to-keep-the-code-modular-and-aim-for-smaller-modulesfiles@FoQ15wo0cV2Tntru6jV-1.md"
      },
      {
        "id": "ask-ai-to-use-subagents-if-possible@n5JxUpashrHKai2XESdd-",
        "title": "Use subagents",
        "slug": "ask-ai-to-use-subagents-if-possible",
        "summary": "Subagents are specialized agents that handle specific tasks in their own isolated context. Using them keeps each part of the work focused, reduces token usage, and produces cleaner results than trying to do everything in",
        "sourcePath": "developer-roadmap/roadmaps/vibe-coding/content/ask-ai-to-use-subagents-if-possible@n5JxUpashrHKai2XESdd-.md"
      },
      {
        "id": "ask-ai-to-write-tests-e2e-tests-can-help-build-a-stable-product@WLOx62vbIhIlv73jcT8zM",
        "title": "Ask AI to write tests",
        "slug": "ask-ai-to-write-tests-e2e-tests-can-help-build-a-stable-product",
        "summary": "Every time AI builds a feature, ask it to write tests for that feature right away. End-to-end tests are especially useful because they simulate a real user going through your app and catch bugs that affect the experience",
        "sourcePath": "developer-roadmap/roadmaps/vibe-coding/content/ask-ai-to-write-tests-e2e-tests-can-help-build-a-stable-product@WLOx62vbIhIlv73jcT8zM.md"
      },
      {
        "id": "ask-for-one-task-at-a-time-rather-than-five-different-items@HpbG5bcOEIZxYlVl9pwod",
        "title": "Ask for one task at a time",
        "slug": "ask-for-one-task-at-a-time-rather-than-five-different-items",
        "summary": "Keep your prompts focused. Ask AI to do one thing, review the result, and then move on to the next. When you stack multiple requests into one prompt, the AI loses focus and mistakes pile up across all of them at once.",
        "sourcePath": "developer-roadmap/roadmaps/vibe-coding/content/ask-for-one-task-at-a-time-rather-than-five-different-items@HpbG5bcOEIZxYlVl9pwod.md"
      },
      {
        "id": "based-on-your-previous-coding-sessions-tell-ai-what-not-to-do@3lHMW2Uje5tQawetE4I21",
        "title": "Tell AI what NOT to do",
        "slug": "based-on-your-previous-coding-sessions-tell-ai-what-not-to-do",
        "summary": "Articles",
        "sourcePath": "developer-roadmap/roadmaps/vibe-coding/content/based-on-your-previous-coding-sessions-tell-ai-what-not-to-do@3lHMW2Uje5tQawetE4I21.md"
      },
      {
        "id": "be-specific-about-what-you-want-rather-than-high-level-vague-instructions@JXtLbQ1JUQOPZorFy1ctF",
        "title": "Be specific about what you want",
        "slug": "be-specific-about-what-you-want-rather-than-high-level-vague-instructions",
        "summary": "Describe exactly what you want — layout, behavior, content, constraints. The more detail you give, the less the AI has to guess. Vague prompts produce vague results, and you end up spending more time correcting than if y",
        "sourcePath": "developer-roadmap/roadmaps/vibe-coding/content/be-specific-about-what-you-want-rather-than-high-level-vague-instructions@JXtLbQ1JUQOPZorFy1ctF.md"
      },
      {
        "id": "chatgpt@XY2l96sry3WyLzzo3KUeU",
        "title": "ChatGPT",
        "slug": "chatgpt",
        "summary": "ChatGPT is a large language model chatbot developed by OpenAI. You can give it a prompt, and it'll generate text that attempts to answer or continue the conversation. Think of it as a super-smart auto-complete that can u",
        "sourcePath": "developer-roadmap/roadmaps/vibe-coding/content/chatgpt@XY2l96sry3WyLzzo3KUeU.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/vibe-coding"
  },
  {
    "slug": "vue",
    "title": "Vue",
    "category": "skill",
    "description": "A focused learning path for mastering Vue, with concepts, tools, projects, and next steps.",
    "topicCount": 84,
    "topics": [
      {
        "id": "api-calls@ZLlz0Azfze-8k3z8HnVvE",
        "title": "API Calls",
        "slug": "api-calls",
        "summary": "There are several options available to make API calls from your Vue.js applications.",
        "sourcePath": "developer-roadmap/roadmaps/vue/content/api-calls@ZLlz0Azfze-8k3z8HnVvE.md"
      },
      {
        "id": "api-styles@OpJ2NMKCGXQezpzURE45R",
        "title": "API Styles",
        "slug": "api-styles",
        "summary": "Though Vue 2 supported many approaches to writing components, only one approach, the \"Options API\", was built in and accessible without plugins. Vue 3, retains the Options API (OAPI), and adds in the Composition API (CAP",
        "sourcePath": "developer-roadmap/roadmaps/vue/content/api-styles@OpJ2NMKCGXQezpzURE45R.md"
      },
      {
        "id": "apollo@l2Rl6OQbL7kYvPlpYCZ0Z",
        "title": "Apollo",
        "slug": "apollo",
        "summary": "Apollo is a platform for building a unified graph, a communication layer that helps you manage the flow of data between your application clients (such as web and native apps) and your back-end services.",
        "sourcePath": "developer-roadmap/roadmaps/vue/content/apollo@l2Rl6OQbL7kYvPlpYCZ0Z.md"
      },
      {
        "id": "app-configurations@qRm08uDZW-D8QDc-9sPX8",
        "title": "App Configurations",
        "slug": "app-configurations",
        "summary": "Every application instance exposes a `config` object that contains the configuration settings for that application. You can modify its properties before mounting your application.",
        "sourcePath": "developer-roadmap/roadmaps/vue/content/app-configurations@qRm08uDZW-D8QDc-9sPX8.md"
      },
      {
        "id": "async-components@Re7tv1U0LxYqE5ShFxQSf",
        "title": "Async Components",
        "slug": "async-components",
        "summary": "In large applications, we may need to divide the app into smaller chunks and only load a component from the server when it's needed. To make that possible, Vue has a `defineAsyncComponent` function.",
        "sourcePath": "developer-roadmap/roadmaps/vue/content/async-components@Re7tv1U0LxYqE5ShFxQSf.md"
      },
      {
        "id": "attribute-inheritance@4S5fVFsFDMbq05ld7n0sF",
        "title": "Attribute Inheritance",
        "slug": "attribute-inheritance",
        "summary": "Attribute inheritance aka \"fallthrough attributes\" is a feature of Vue.js that allows you to inherit attributes from a parent component.",
        "sourcePath": "developer-roadmap/roadmaps/vue/content/attribute-inheritance@4S5fVFsFDMbq05ld7n0sF.md"
      },
      {
        "id": "axios@n5IlN-wv4k0r16CvhoSpD",
        "title": "Axios",
        "slug": "axios",
        "summary": "Axios is a client HTTP API based on the XMLHttpRequest interface provided by browsers. The most common way for frontend programs to communicate with servers is through the HTTP protocol. You are probably familiar with th",
        "sourcePath": "developer-roadmap/roadmaps/vue/content/axios@n5IlN-wv4k0r16CvhoSpD.md"
      },
      {
        "id": "binding-events@b7iXwtUnELg_ShbCyTrNA",
        "title": "Binding Events",
        "slug": "binding-events",
        "summary": "Vue.js is an open-source Model–View–ViewModel front-end JavaScript framework for building user interfaces and single-page applications. Vue.js has many own directives for DOM manipulation such as v-bind, v-on, v-model, e",
        "sourcePath": "developer-roadmap/roadmaps/vue/content/binding-events@b7iXwtUnELg_ShbCyTrNA.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/vue"
  },
  {
    "slug": "wordpress",
    "title": "Wordpress",
    "category": "skill",
    "description": "A focused learning path for mastering Wordpress, with concepts, tools, projects, and next steps.",
    "topicCount": 115,
    "topics": [
      {
        "id": "accessibility@bfFSH7alQ8IZZJ5gUed-T",
        "title": "Accessibility",
        "slug": "accessibility",
        "summary": "Accessibility refers to designing and developing websites that are usable by people of all abilities, including those with disabilities. This involves ensuring that content is perceivable, operable, understandable, and r",
        "sourcePath": "developer-roadmap/roadmaps/wordpress/content/accessibility@bfFSH7alQ8IZZJ5gUed-T.md"
      },
      {
        "id": "acf@JTWl8rqTwaD2YulcOnwu9",
        "title": "Advanced Custom Fields (ACF)",
        "slug": "acf",
        "summary": "Advanced Custom Fields (ACF) is a WordPress plugin that allows you to add custom fields to your WordPress edit screens. These custom fields can include various types of data, such as text, images, files, and more, enabli",
        "sourcePath": "developer-roadmap/roadmaps/wordpress/content/acf@JTWl8rqTwaD2YulcOnwu9.md"
      },
      {
        "id": "actions@zAV29-MTFNLLVPu3rlRFv",
        "title": "Actions",
        "slug": "actions",
        "summary": "Actions in WordPress are hooks that allow you to execute custom functions at specific points in the WordPress core, plugins, and themes. They provide a way to \"do\" something at a particular moment during the execution of",
        "sourcePath": "developer-roadmap/roadmaps/wordpress/content/actions@zAV29-MTFNLLVPu3rlRFv.md"
      },
      {
        "id": "activity-logging@KBHvwgqRRRg-amfGTUAL3",
        "title": "Activity Logging",
        "slug": "activity-logging",
        "summary": "Activity logging involves tracking and recording actions taken within a system, such as user logins, content modifications, and settings changes. This creates an audit trail that can be used for security analysis, troubl",
        "sourcePath": "developer-roadmap/roadmaps/wordpress/content/activity-logging@KBHvwgqRRRg-amfGTUAL3.md"
      },
      {
        "id": "admin-menu@nTuHbvhf6OgM6ZekXqGSa",
        "title": "Admin Menu",
        "slug": "admin-menu",
        "summary": "The Admin Menu in WordPress is the navigation panel located on the left side of the WordPress dashboard. It provides access to various administrative functions, such as managing posts, pages, media, users, settings, and ",
        "sourcePath": "developer-roadmap/roadmaps/wordpress/content/admin-menu@nTuHbvhf6OgM6ZekXqGSa.md"
      },
      {
        "id": "advanced-php--architecture@aI9yJGnzztuVayUhgIxAw",
        "title": "Advanced PHP & Architecture",
        "slug": "advanced-php--architecture",
        "summary": "Advanced PHP & Architecture in WordPress delves into the deeper aspects of PHP programming and the underlying structure of the WordPress platform. It involves understanding object-oriented programming principles, design ",
        "sourcePath": "developer-roadmap/roadmaps/wordpress/content/advanced-php--architecture@aI9yJGnzztuVayUhgIxAw.md"
      },
      {
        "id": "ajax-in-wordpress@BS0poxbCfYfBvvnZzODH0",
        "title": "AJAX in WordPress",
        "slug": "ajax-in-wordpress",
        "summary": "AJAX (Asynchronous JavaScript and XML) is a web development technique that allows web pages to update content dynamically without requiring a full page reload. This is achieved by exchanging data with a server in the bac",
        "sourcePath": "developer-roadmap/roadmaps/wordpress/content/ajax-in-wordpress@BS0poxbCfYfBvvnZzODH0.md"
      },
      {
        "id": "assets@TX8dzu0k2sgXUnUOldhmZ",
        "title": "Assets Optimization",
        "slug": "assets",
        "summary": "Assets optimization involves refining the files that make up a website, such as images, CSS, and JavaScript, to improve loading speed and overall performance. This process typically includes techniques such as compressin",
        "sourcePath": "developer-roadmap/roadmaps/wordpress/content/assets@TX8dzu0k2sgXUnUOldhmZ.md"
      }
    ],
    "sourceUrl": "https://roadmap.sh/wordpress"
  }
]
;

export const featuredRoadmapSlugs = 
[
  "frontend",
  "backend",
  "full-stack",
  "devops",
  "ai-engineer",
  "ai-data-scientist",
  "data-engineer",
  "data-analyst",
  "python",
  "javascript",
  "typescript",
  "react",
  "nodejs",
  "system-design",
  "sql",
  "computer-science",
  "machine-learning",
  "cyber-security",
  "cloudflare",
  "kubernetes",
  "docker"
] as const;
