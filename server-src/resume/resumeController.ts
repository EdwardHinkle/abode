export class ResumeController {
    static resumeRoute(req, res, next) {

        // I am a design-oriented, emotion-centric, human-interaction software engineer. I have extensive experience in both web design and web engineering leading to a solutions-oriented approach to web development. Technology should exist as a conduit to an engaging, human-centered interaction. I believe that software and design are inseparable.

        let currentWork = [
            {
                type: "Work",
                date: "Since 2017",
                position: "Senior UI Engineer",
                company: "ThreatConnect, Inc.",
                companyUrl: "https://www.threatconnect.com/",
                summary: "I am the senior member of the UI/UX team, leading the effort to transition the platform from a Java/JSF front-end to an <strong>Angular</strong> front-end communicating with a Java <strong>REST API</strong> backend. I’ve led the efforts to develop a customizable Dashboard and an associations graph using <strong>Cytoscape.js</strong>."
            },
            {
                type: "Freelance",
                date: "Since 2016",
                position: "Owner",
                company: "Studio H",
                summary: "I’ve developed and released <a href='https://indigenous.abode.pub/ios/'>Indigenous</a>, a open source Social Reader app built in <strong>Swift</strong> that supports the W3C standards of <strong>IndieAuth</strong> and <strong>Micropub</strong>. As well as contributed an iOS app to the open source <a href='https://github.com/cleverdevil/Indiepaper-macOS/graphs/contributors'>Indiepaper project</a>. I have also released several iMessage stickers packs on the App Store."
            }
        ];

        let workHistory = [
            {
                type: "Work",
                date: "2015 - 2017",
                position: "Senior Software Engineer",
                company: "Maestro, LLC",
                companyUrl: "https://meetmaestro.com",
                summary: "I helped lead the services team of Maestro to develop and build beautiful marketing and learning solutions working for clients such as Google, Franklin Covey, Framework Homeownership, Wright Medical. The technologies I’ve used to make solutions for clients are: <strong>Angular</strong>, <strong>Node.js</strong>, <strong>Backbone</strong>, <strong>TypeScript</strong>, <strong>Rails</strong>, <strong>Ionic</strong>, <strong>Sass</strong>, <strong>Angular Material</strong>, <strong>Foundation</strong>, <strong>Bootstrap</strong> and the <strong>Adapt Framework</strong>. Most of our projects are <strong>Scorm-compliant</strong> e-learning courses."
            },
            {
                type: "Freelance",
                date: "2013 - 2016",
                position: "Owner",
                company: "EH Studio",
                summary: "I’ve worked with local churches and a local gym to design and develop modern websites that allow for simplified communication and marketing, while providing intuitive user interfaces."
            },
            {
                type: "Work",
                date: "2011 - 2015",
                position: "Geospatial Software Engineer",
                company: "USAID / Macfadden",
                companyUrl: "https://usaid.gov",
                summary: "Worked as a Macfadden contractor assigned to a USAID internal product development team. My work covered Frontend Development using <strong>Backbone.js</strong> and <strong>Handlebars.js</strong>. Geospatial Integration using both <strong>Leaflet.js</strong> and <strong>ArcGIS APIs</strong>. Interactive Data Visualizations using <strong>d3.js</strong>. I also contributed to the Backend Development of a REST API in <strong>PHP</strong> as a custom module in <strong>Drupal 6.</strong>"
            },
            {
                type: "Work",
                date: "2010 - 2011",
                position: "Family Room Specialist / Mentor",
                company: "Apple, Inc",
                summary: "I taught customers how to use iPhones, iPads and iMacs in both individual-based sessions as well as group-based workshops. I observed and mentored other employees on Apple cultural interactions."
            },
            {
                type: "Work",
                date: "2009 - 2010",
                position: "Biology Dept. Network Administrator",
                company: "University of Hawaii",
                companyUrl: "https://www.hawaii.edu",
                summary: "I ensured the network continued to function and improved the public-facing department website. Re-branded and updating site for contemporary design and intuitive user interaction."
            },
            {
                type: "Freelance",
                date: "2006 - 2009",
                position: "Owner",
                company: "Studio6Twelve",
                summary: "I worked with universities, non-profits, realtors, and small business clients to analyze, design, develop, test, and host their software development projects and website designs."
            },
            {
                type: "Work",
                date: "2007 - 2008",
                position: "Chief Information Officer",
                company: "World Surf Engine",
                summary: "I helped build a start-up company with the CEO by helping to establish business goals and development. I built and designed a web application using PHP, CSS, and JavaScript. Site provided user interaction, communication and information on surfing and other water-related excursions."
            }
        ];

        let recommendations: [
            {
                name: "Carla Nelson",
                url: "https://www.linkedin.com/in/carlyrnelson/",
                position: "Software Developer",
                company: "ThreatConnect, Inc.",
                published: "July 26, 2018",
                relation: "Eddie worked with Carla in the same group",
                content: "I had the pleasure of working with Eddie over the last year at ThreatConnect, collaborating on several new Angular projects for the platform. Eddie was such an exceptional addition to our UI Engineering Team! No task was too big for him, and he always conquered them with such a positive mindset! Eddie was always approachable and helpful when trying to solve problems as a team. He was truly the most motivating developer to work alongside. Definitely a keeper!!"
            },
            {
                name: "Adia Smith",
                url: "https://www.linkedin.com/in/adia-smith-training/",
                position: "Human Resource Manager, Field Learning and Development",
                company: "CSL Plasma",
                published: "September 21, 2017",
                relation: "Adia was a client of Eddie’s",
                content: "I had the pleasure of working with Eddie on a course project for my organization's training program. The simulation work created by far exceeded our expectations. Eddie has a great sense for bringing to life what a client has requested, and works relentlessly to get it to exactly what was requested. Thank you again Eddie for your superior work."
            },
            {
                name: "Michael Jefferies",
                url: "https://www.linkedin.com/in/michaeljjeff/",
                position: "Director of Sales",
                company: "Maestro",
                published: "September 20, 2017",
                relation: "Michael worked with Eddie in different groups",
                content: "Eddie is one of the most personable, team-player colleagues I've ever had. Always willing to answer questions, give additional context and support the team in whatever way he can. Not to mention, he writes great code! If you have a chance to work with Eddie take it!"
            }
            // {
            //     name: "Kaila Kaltrider",
            //     url: "",
            //     company: "",
            //     position: "",
            //     published: "",
            //     relation: "",
            //     content: ""
            // },
            // {
            //     name: "Daniel Bedich",
            //     url: "",
            //     company: "",
            //     position: "",
            //     published: "",
            //     relation: "",
            //     content: ""
            // },
            // {
            //     name: "Daniel Krasinski",
            //     url: "",
            //     company: "",
            //     position: "",
            //     published: "",
            //     relation: "",
            //     content: ""
            // },
            // {
            //     name: "Jacob Bodnar",
            //     url: "",
            //     company: "",
            //     position: "",
            //     published: "",
            //     relation: "",
            //     content: ""
            // },
            // {
            //     name: "John Pinkster",
            //     url: "",
            //     company: "",
            //     position: "",
            //     published: "",
            //     relation: "",
            //     content: ""
            // },
            // {
            //     name: "Joe Gasiorek",
            //     url: "",
            //     company: "",
            //     position: "",
            //     published: "",
            //     relation: "",
            //     content: ""
            // },
            // {
            //     name: "Markis Snodgrass",
            //     url: "",
            //     company: "",
            //     position: "",
            //     published: "",
            //     relation: "",
            //     content: ""
            // },
            // {
            //     name: "Davin Aoyagi",
            //     url: "",
            //     company: "",
            //     position: "",
            //     published: "",
            //     relation: "",
            //     content: ""
            // },
            // {
            //     name: "Sandee Carillo",
            //     url: "",
            //     company: "",
            //     position: "",
            //     published: "",
            //     relation: "",
            //     content: ""
            // }
        ];

        res.render("resume/resume", {
            currentWork: currentWork,
            workHistory: workHistory
        });
    }
}