import React from 'react';
import { UserIcon, BriefcaseIcon, HeartIcon, BuildingIcon, FolderIcon, AwardIcon, GraduationCapIcon, CodeIcon, BookOpenIcon } from 'lucide-react';
const ProfileCustomization = () => {
  const sections = [{
    id: 'summary',
    icon: <UserIcon size={20} />,
    title: 'Summary',
    content: 'Product designer with 5+ years of experience specializing in UI/UX for SaaS products. Passionate about creating intuitive interfaces that solve real user problems.',
    editable: true
  }, {
    id: 'workExperience',
    icon: <BriefcaseIcon size={20} />,
    title: 'Work Experience',
    content: [{
      company: 'InnovateTech',
      role: 'Senior Product Designer',
      industry: 'Technology',
      period: 'Jan 2021 - Present',
      description: "Leading the product design team for the company's flagship SaaS platform. Implemented a new design system that improved development speed by 35%."
    }, {
      company: 'DesignHub',
      role: 'UX Designer',
      industry: 'Creative Agency',
      period: 'Mar 2018 - Dec 2020',
      description: 'Collaborated with cross-functional teams to deliver user-centered design solutions for clients across fintech, healthcare, and e-commerce sectors.'
    }],
    editable: true
  }, {
    id: 'education',
    icon: <BookOpenIcon size={20} />,
    title: 'Education',
    content: [{
      degree: 'Master of Design',
      institution: 'Stanford University',
      field: 'Human-Computer Interaction',
      period: '2016 - 2018'
    }, {
      degree: 'Bachelor of Arts',
      institution: 'Rhode Island School of Design',
      field: 'Graphic Design',
      period: '2012 - 2016'
    }],
    editable: true
  }, {
    id: 'projects',
    icon: <FolderIcon size={20} />,
    title: 'Projects',
    content: {
      current: ['AI-powered design system', 'Marketplace UX redesign'],
      past: ['Social media analytics dashboard', 'E-learning platform UI']
    },
    editable: true
  }, {
    id: 'certifications',
    icon: <GraduationCapIcon size={20} />,
    title: 'Certifications & Awards',
    content: [{
      name: 'UX Design Certification',
      issuer: 'Google',
      date: 'June 2022'
    }, {
      name: 'Best Mobile App Design',
      issuer: 'Design Awards 2021',
      date: 'November 2021'
    }, {
      name: 'Advanced Product Management',
      issuer: 'Product School',
      date: 'March 2020'
    }],
    editable: true
  }, {
    id: 'skills',
    icon: <CodeIcon size={20} />,
    title: 'Skills',
    content: [{
      category: 'Design',
      skills: ['UI Design', 'UX Research', 'Wireframing', 'Prototyping', 'Design Systems']
    }, {
      category: 'Tools',
      skills: ['Figma', 'Adobe XD', 'Sketch', 'InVision', 'Zeplin']
    }, {
      category: 'Technical',
      skills: ['HTML/CSS', 'JavaScript', 'React', 'Design Tokens']
    }],
    editable: true
  }, {
    id: 'interests',
    icon: <HeartIcon size={20} />,
    title: 'Interests',
    content: ['UI/UX Design', 'Product Strategy', 'Artificial Intelligence', 'Web3', 'Productivity Tools'],
    editable: true
  }];
  return <div className="mb-8">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <UserIcon size={20} className="mr-2 text-yellow-400" />
        Customize Profile
      </h2>
      <div className="space-y-4">
        {sections.map(section => <div key={section.id} className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold flex items-center text-white">
                <span className="text-yellow-400 mr-2">{section.icon}</span>
                {section.title}
              </h3>
              {section.editable && <button className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded-full border border-gray-700 text-gray-300">
                  Edit
                </button>}
            </div>
            {section.id === 'summary' && <p className="text-gray-300">{section.content}</p>}
            {section.id === 'interests' && <div className="flex flex-wrap gap-2">
                {section.content.map((interest, index) => <span key={index} className="bg-gray-800 px-3 py-1 rounded-full text-sm border border-gray-700 text-gray-300">
                    {interest}
                  </span>)}
              </div>}
            {section.id === 'workExperience' && <div className="space-y-4 text-gray-300">
                {section.content.map((job, index) => <div key={index} className="border-l-2 border-gray-700 pl-4 py-1">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-medium text-white">{job.role}</h4>
                      <span className="text-xs text-gray-400">
                        {job.period}
                      </span>
                    </div>
                    <p className="flex items-center text-sm mb-1">
                      <BuildingIcon size={14} className="mr-1 text-gray-500" />
                      {job.company} • {job.industry}
                    </p>
                    <p className="text-sm text-gray-400">{job.description}</p>
                  </div>)}
                <button className="w-full mt-2 text-yellow-400 border border-yellow-400 rounded-md py-1 text-sm hover:bg-yellow-400 hover:text-black transition-colors">
                  + Add Work Experience
                </button>
              </div>}
            {section.id === 'education' && <div className="space-y-4 text-gray-300">
                {section.content.map((edu, index) => <div key={index} className="border-l-2 border-gray-700 pl-4 py-1">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-medium text-white">{edu.degree}</h4>
                      <span className="text-xs text-gray-400">
                        {edu.period}
                      </span>
                    </div>
                    <p className="flex items-center text-sm mb-1">
                      <BookOpenIcon size={14} className="mr-1 text-gray-500" />
                      {edu.institution}
                    </p>
                    <p className="text-sm text-gray-400">{edu.field}</p>
                  </div>)}
                <button className="w-full mt-2 text-yellow-400 border border-yellow-400 rounded-md py-1 text-sm hover:bg-yellow-400 hover:text-black transition-colors">
                  + Add Education
                </button>
              </div>}
            {section.id === 'projects' && <div className="space-y-3 text-gray-300">
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-1">
                    Currently working on:
                  </h4>
                  <ul className="list-disc pl-5">
                    {section.content.current.map((project, index) => <li key={index}>{project}</li>)}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-1">
                    Previously worked on:
                  </h4>
                  <ul className="list-disc pl-5">
                    {section.content.past.map((project, index) => <li key={index}>{project}</li>)}
                  </ul>
                </div>
              </div>}
            {section.id === 'certifications' && <div className="space-y-3 text-gray-300">
                {section.content.map((cert, index) => <div key={index} className="flex items-start">
                    <div className="bg-gray-800 p-2 rounded-lg mr-3 text-yellow-400">
                      <AwardIcon size={16} />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{cert.name}</h4>
                      <p className="text-sm text-gray-400">
                        {cert.issuer} • {cert.date}
                      </p>
                    </div>
                  </div>)}
              </div>}
            {section.id === 'skills' && <div className="space-y-4 text-gray-300">
                {section.content.map((skillGroup, index) => <div key={index}>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">
                      {skillGroup.category}:
                    </h4>
                    <div className="overflow-x-auto hide-scrollbar pb-1">
                      <div className="flex gap-2 min-w-max">
                        {skillGroup.skills.map((skill, idx) => <span key={idx} className="bg-gray-800 px-3 py-1 rounded-full text-sm border border-gray-700 text-gray-300 whitespace-nowrap">
                            {skill}
                          </span>)}
                      </div>
                    </div>
                  </div>)}
              </div>}
          </div>)}
      </div>
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          height: 4px;
        }
        .hide-scrollbar::-webkit-scrollbar-track {
          background: #1f1f1f;
          border-radius: 10px;
        }
        .hide-scrollbar::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 10px;
        }
        .hide-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #444;
        }
      `}</style>
    </div>;
};
export default ProfileCustomization;