import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from 'app/components/ui/breadcrumb';
import { Text } from 'app/components/text';

const GetInvolvedPage = () => {
  const title = 'Get involved | Pillage First! (Ask Questions Later)';

  return (
    <>
      <title>{title}</title>
      <main className="flex flex-col gap-4 max-w-3xl px-2 lg:px-0 mx-auto">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink to="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>Get involved</BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Text as="h1">Get involved</Text>
        <div className="flex flex-col gap-4" />
      </main>
    </>
  );
};

export default GetInvolvedPage;
