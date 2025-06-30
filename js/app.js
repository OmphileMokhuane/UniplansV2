const users = [
    {
        id: 1,
        username: "Melo",
        password: "6May@2002"
    },
    {
        id:2,
        username: "local",
        password: "qawsedrftg@1234"
    }
]

const modules = [];
const tests = [];
const assigments = [];

const formatCurrency = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-ZA');
}

const getModules = () => {
    return modules;
}

const getModulesById = (id) => {
    return modules.find(module => module.id === id);
}

const addModule = (moduleData) => {
    
}



export {
    formatCurrency,
    getModules,
    getModulesById
};