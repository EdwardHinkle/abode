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

        let recommendations = [
            {
                name: "Kaila Kaltrider",
                url: "https://www.linkedin.com/in/kaila-kaltrider-b648936a/",
                company: "Maestro",
                position: "Project Manager",
                published: "September 1, 2017",
                relation: "Kaila worked with Eddie in different groups",
                content: "Working with Eddie the past 2 years has been a great experience! Always eager to assist and never without a positive attitude, he made work fun and is the embodiment of a team player. Eddie is a breath of fresh air in a world where developers and other teams often struggle to communicate. As a QA analyst, I rarely saw Eddie without a solution. He was always ready to assist with any bugs that I found, and more than willing to take time to explain not only the solution and impact, but also offer suggestions for how we, as a team, could improve in the future. Eddie is approachable and strives to create an environment where open communication with developers about issues large or small is the norm. Eddie helped set high expectations for team communication and continually provided updates of his progress, complications, time estimates, impacts, and successes throughout the day. Working with Eddie has truly been a pleasure and I hope for the chance to work together again."
            },
            {
                name: "Daniel Bedich",
                url: "https://www.linkedin.com/in/daniel-bedich-0a0745a8/",
                company: "Maestro",
                position: "Product Designer",
                published: "August 22, 2017",
                relation: "Eddie worked with Daniel in the same group",
                content: "A user first thinker! Eddie has taken a user centered approach to the projects we have worked on together. Animations were thoughtfully planned out to ensure the user knew where they are, where they came from and where they are going. His efforts greatly increased the navigational experience in an efficient and cost effective way. He knows the value a good experience can bring works hard to create that for the user"
            },
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
            },

            {
                name: "Daniel Krasinski",
                url: "https://www.linkedin.com/in/daniel-krasinski-6a0a4168/",
                company: "Maestro",
                position: "Senior Account Manager",
                published: "August 10, 2017",
                relation: "Daniel worked with Eddie in different groups",
                content: "I had the pleasure of working with Eddie on a variety of projects during our time together. I found him knowledgeable as a technology consultant, VERY effective as a Frontend Developer, and peerless when interfacing with clients. Eddie is also a great problem solver and is constantly exploring innovative/fringe techniques to better service his company and their clients. However, Eddie's greatest asset is his character. He would often work tirelessly to meet a deadline or delight a client and could do so joyfully and effectively. His humble nature will be the first thing you notice after meeting him and will strike you more after you get to see his work. Lastly, Eddie's positive attitude can uplift both internal team members and the clients he serves, even in the direst of circumstances. I am truly sad to see him leave and eagerly hope to work with him again!"
            },
            {
                name: "Jacob Bodnar",
                url: "https://www.linkedin.com/in/jbodnar/",
                company: "Maestro",
                position: "VP of Operations",
                published: "August 5, 2017",
                relation: "Jacob worked with Eddie in different groups",
                content: "I worked with Eddie for several years and was always delighted by how easy he was to work with. Eddie is a great thinker, able to quickly determine the appropriate solution to a client's problem. He was always flexible when something didn't go as planned and level headed regardless of the complexity or pressure."
            },
            {
                name: "John Pinkster",
                url: "https://www.linkedin.com/in/john-pinkster/",
                company: "Maestro",
                position: "Principal Software Engineer",
                published: "August 5, 2017",
                relation: "John was senior to Eddie but didn't manage directly",
                content: "His profile says it all ... Amazing personality, reliable, always willing to help out, flexible and teachable! From the moment I interviewed Eddie, I could tell he was going to come in and absolutely thrive at Maestro. He was able to work autonomously as a remote employee while still connecting with our team on a personal level, which is difficult to do. As a developer, he went from caught up to speed very quickly and always looked for new challenges. We are very proud of the growth we saw and are excited for him to step out into a new world and share his talent with others. We will miss you sir. It was a pleasure working with you."
            },
            {
                name: "Joe Gasiorek",
                url: "https://www.linkedin.com/in/joegasiorek/",
                company: "Mobile",
                position: "Director of Engineering",
                published: "April 16, 2013",
                relation: "Joe worked with Eddie in different groups",
                content: "At OTI, I saw Eddie's wide skill set as a Geospatial Software Engineer. His work creating visualizations, that consumed many different data sets, enabled the team to make better programatic decisions. Eddie's flexibility in discussing both technical details and project goals made him a great asset to the team."
            }
        ];

        res.render("resume/resume", {
            currentWork: currentWork,
            workHistory: workHistory,
            recommendations: recommendations
        });
    }
}