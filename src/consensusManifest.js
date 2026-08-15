export const CONSENSUS_ROLE_MANIFEST = {
    tool: 'sysconsens',
    version: '1.0.0',
    matchBy: 'content.assignments',
    description: 'Systemic Consensing decision tool.',
    roles: [
        {
            key: 'consensusSession',
            name: 'Systemic Consensing Session',
            description: 'A consensus session with a question, options, end time, status and votes.',
            structure: [
                { key: 'title', display: 'Title', type: 'string' },
                { key: 'question', display: 'Question', type: 'string' },
                { key: 'options', display: 'Options', type: 'array' },
                { key: 'endTime', display: 'End Time', type: 'string' },
                { key: 'status', display: 'Status', type: 'string' },
                { key: 'votes', display: 'Votes', type: 'object' },
            ],
        },
    ],
}
