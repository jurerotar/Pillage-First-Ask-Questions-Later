import { ResourceFieldId, ResourceFieldLayout, ResourceFields } from 'interfaces/models/game/village';
import { Resource } from 'interfaces/models/game/resource';

const createResourceFieldsFromResourceLayout = (layout: Partial<ResourceFieldLayout>): ResourceFields => {
  const resourceFields: Partial<ResourceFields> = {};
  Object.keys(layout).forEach((resourceFieldId: string) => {
    resourceFields[resourceFieldId as ResourceFieldId] = {
      type: layout[resourceFieldId as ResourceFieldId] as Resource,
      level: 0
    };
  });

  return resourceFields as ResourceFields;
};

export default createResourceFieldsFromResourceLayout;
