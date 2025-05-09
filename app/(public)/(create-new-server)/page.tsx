import { CreateNewServerForm } from 'app/(public)/(create-new-server)/components/create-new-server-form';

const CreateNewServerPage = () => {
  return (
    <div className="min-h-screen bg-background p-2">
      <div className="max-w-3xl mx-auto">
        <CreateNewServerForm />
      </div>
    </div>
  );
};

export default CreateNewServerPage;
