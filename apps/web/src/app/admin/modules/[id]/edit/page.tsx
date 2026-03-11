type Props = { params: Promise<{ id: string }> };

export default async function EditModulePage({ params }: Props) {
  const { id } = await params;
  const { EditModuleClient } = await import('./edit-module-client');
  return <EditModuleClient id={id} />;
}

