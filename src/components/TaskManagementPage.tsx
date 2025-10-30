import React, { useState, useMemo, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import { Project, Phase, Sprint, Task, ToastMessage, User } from '../types';
import { ProjectHeader } from './ProjectHeader';
import { Card, Button } from './ui';
import { Plus, MoreVertical, Zap, LoaderCircle, AlertTriangle } from 'lucide-react';
import { generateTaskDescription } from '../services/geminiService';
import { Remarkable } from 'remarkable';

const md = new Remarkable({ html: true });

interface AddTaskModalProps {
    onClose: () => void;
    setToast: (toast: ToastMessage | null) => void;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({ onClose, setToast }) => {
    const { project, addTask } = useProject();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [assigneeId, setAssigneeId] = useState<string | null>(null);
    const [phaseId, setPhaseId] = useState<string>('');
    const [sprintId, setSprintId] = useState<string>('');
    const [priority, setPriority] = useState<Task['priority']>('Medium');
    const [dueDate, setDueDate] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const availableSprints = useMemo(() => {
        if (!phaseId) return [];
        return project?.phases.find(p => p.id === phaseId)?.sprints || [];
    }, [phaseId, project]);

    const handleGenerateDescription = async () => {
        if (!title || !phaseId || !project) {
            setToast({ message: 'Please provide a title and select a phase first.', type: 'error' });
            return;
        }
        setIsGenerating(true);
        try {
            const phase = project.phases.find(p => p.id === phaseId);
            const sprint = phase?.sprints.find(s => s.id === sprintId);
            if(phase) {
                const generatedDesc = await generateTaskDescription(project, phase, sprint, title);
                setDescription(generatedDesc);
                setToast({ message: 'Description generated successfully!', type: 'success' });
            }
        } catch (error: any) {
            setToast({ message: error.message || 'Failed to generate description.', type: 'error' });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title && phaseId && project) {
            addTask(project.id, {
                title,
                description,
                status: 'todo',
                assigneeId,
                phaseId,
                sprintId: sprintId || undefined,
                priority,
                dueDate: dueDate || undefined,
            });
            setToast({ message: 'Task added successfully!', type: 'success' });
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-[100]" onClick={onClose}>
            <Card title="Add New Task" className="w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="task-title" className="block text-sm font-medium">Title</label>
                        <input type="text" id="task-title" value={title} onChange={e => setTitle(e.target.value)} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-charcoal-700 dark:border-gray-600" />
                    </div>
                    <div>
                         <div className="flex justify-between items-center">
                            <label htmlFor="task-description" className="block text-sm font-medium">Description</label>
                            <Button type="button" size="sm" variant="ghost" onClick={handleGenerateDescription} disabled={isGenerating || !title || !phaseId}>
                                {isGenerating ? <LoaderCircle className="w-4 h-4 animate-spin mr-2"/> : <Zap className="w-4 h-4 mr-2"/>}
                                Generate with AI
                            </Button>
                        </div>
                        <textarea id="task-description" value={description} onChange={e => setDescription(e.target.value)} rows={4} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-charcoal-700 dark:border-gray-600" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="task-priority" className="block text-sm font-medium">Priority</label>
                            <select id="task-priority" value={priority} onChange={e => setPriority(e.target.value as Task['priority'])} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-charcoal-700 dark:border-gray-600">
                                <option>Low</option>
                                <option>Medium</option>
                                <option>High</option>
                            </select>
                        </div>
                         <div>
                            <label htmlFor="task-due-date" className="block text-sm font-medium">Due Date</label>
                            <input type="date" id="task-due-date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-charcoal-700 dark:border-gray-600" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="task-phase" className="block text-sm font-medium">Phase</label>
                            <select id="task-phase" value={phaseId} onChange={e => { setPhaseId(e.target.value); setSprintId(''); }} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-charcoal-700 dark:border-gray-600">
                                <option value="" disabled>Select Phase</option>
                                {project?.phases.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                         <div>
                            <label htmlFor="task-sprint" className="block text-sm font-medium">Sprint (Optional)</label>
                            <select id="task-sprint" value={sprintId} onChange={e => setSprintId(e.target.value)} disabled={availableSprints.length === 0} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-charcoal-700 dark:border-gray-600">
                                <option value="">None</option>
                                {availableSprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>
                     <div>
                        <label htmlFor="task-assignee" className="block text-sm font-medium">Assignee</label>
                        <select id="task-assignee" value={assigneeId || ''} onChange={e => setAssigneeId(e.target.value || null)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm dark:bg-charcoal-700 dark:border-gray-600">
                            <option value="">Unassigned</option>
                            {project?.users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit">Create Task</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

interface TaskCardProps {
    task: Task;
}

const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
    const { project, updateTask } = useProject();
    const assignee = project?.users.find(u => u.id === task.assigneeId);
    const phase = project?.phases.find(p => p.id === task.phaseId);

    const priorityStyles = {
        High: 'border-l-4 border-brand-accent',
        Medium: 'border-l-4 border-brand-yellow',
        Low: 'border-l-4 border-brand-primary',
    };
    
    const handleStatusChange = (newStatus: Task['status']) => {
        if (project) {
            updateTask(project.id, { ...task, status: newStatus });
        }
    };

    return (
        <Card className={`p-4 space-y-2 ${priorityStyles[task.priority || 'Medium']}`}>
            <div className="flex justify-between items-start">
                <h4 className="font-semibold text-gray-900 dark:text-white leading-tight">{task.title}</h4>
                <select 
                    value={task.status} 
                    onChange={e => handleStatusChange(e.target.value as Task['status'])}
                    className="text-xs border-gray-300 rounded-md shadow-sm dark:bg-charcoal-700 dark:border-gray-600"
                >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                </select>
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: md.render(task.description) }} />
            <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                {task.dueDate ? <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span> : <span />}
                {task.priority === 'High' && <AlertTriangle className="w-4 h-4 text-brand-accent" />}
            </div>
            <div className="flex justify-between items-center pt-2 border-t dark:border-charcoal-700">
                <div className="text-xs text-gray-500 dark:text-gray-400">{phase?.name || 'Unlinked'}</div>
                {assignee ? (
                    <div className="flex items-center space-x-2">
                         <span className="text-sm">{assignee.avatar}</span>
                        <span className="text-xs font-medium">{assignee.name}</span>
                    </div>
                ) : <span className="text-xs text-gray-400">Unassigned</span>}
            </div>
        </Card>
    );
};

interface TaskManagementPageProps {
  onBack: () => void;
  setToast: (toast: ToastMessage | null) => void;
}

export const TaskManagementPage: React.FC<TaskManagementPageProps> = ({ onBack, setToast }) => {
    const { project, theme, setTheme, updateProject } = useProject();
    const [isModalOpen, setIsModalOpen] = useState(false);

     useEffect(() => {
        if (!project) return;

        const existingTaskIds = new Set((project.tasks || []).map(task => {
            return task.sprintId ? `sprint-${task.sprintId}` : `phase-${task.phaseId}`;
        }));

        const newTasks: Task[] = [];

        project.phases.forEach(phase => {
            if (phase.sprints.length > 0) {
                phase.sprints.forEach(sprint => {
                    const taskId = `sprint-${sprint.id}`;
                    if (!existingTaskIds.has(taskId)) {
                        newTasks.push({
                            id: `task-${taskId}-${Date.now()}`,
                            title: sprint.name,
                            description: sprint.description,
                            status: sprint.status === 'completed' ? 'done' : 'todo',
                            assigneeId: null,
                            phaseId: phase.id,
                            sprintId: sprint.id,
                            createdAt: new Date(),
                            priority: 'Medium',
                        });
                    }
                });
            } else {
                const taskId = `phase-${phase.id}`;
                if (!existingTaskIds.has(taskId)) {
                     newTasks.push({
                        id: `task-${taskId}-${Date.now()}`,
                        title: phase.name,
                        description: phase.description,
                        status: phase.status === 'completed' ? 'done' : 'todo',
                        assigneeId: null,
                        phaseId: phase.id,
                        createdAt: new Date(),
                        priority: 'Medium',
                    });
                }
            }
        });

        if (newTasks.length > 0) {
            const updatedTasks = [...(project.tasks || []), ...newTasks];
            updateProject({ ...project, tasks: updatedTasks });
        }
    }, [project, updateProject]);


    const tasks = project?.tasks || [];
    const columns: { title: string, status: Task['status'] }[] = [
        { title: 'To Do', status: 'todo' },
        { title: 'In Progress', status: 'in-progress' },
        { title: 'Done', status: 'done' },
    ];

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <ProjectHeader onGoHome={onBack} theme={theme} setTheme={setTheme} showBackButton />
             <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Task Board</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Organize, assign, and track project tasks.</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="mr-2 w-4 h-4" /> Add Task
                </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                {columns.map(col => (
                    <div key={col.status} className="bg-gray-100 dark:bg-charcoal-800/50 p-4 rounded-lg">
                        <h3 className="font-semibold mb-4">{col.title} ({tasks.filter(t => t.status === col.status).length})</h3>
                        <div className="space-y-4">
                            {tasks.filter(t => t.status === col.status).map(task => (
                                <TaskCard key={task.id} task={task} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            {isModalOpen && <AddTaskModal onClose={() => setIsModalOpen(false)} setToast={setToast}/>}
        </div>
    );
};