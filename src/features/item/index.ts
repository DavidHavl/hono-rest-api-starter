import { createRouter } from '@/app';
import { handler as itemDeleteHandler, route as itemDeleteRoute } from '@/features/item/routes/item.delete';
import { handler as itemGetHandler, route as itemGetRoute } from '@/features/item/routes/item.get';
import { handler as itemPatchHandler, route as itemPatchRoute } from '@/features/item/routes/item.patch';
import { handler as itemPostHandler, route as itemPostRoute } from '@/features/item/routes/item.post';
import { handler as itemsGetHandler, route as itemsGetRoute } from '@/features/item/routes/items.get';

const router = createRouter();
router
  .openapi(itemGetRoute, itemGetHandler)
  .openapi(itemsGetRoute, itemsGetHandler)
  .openapi(itemPostRoute, itemPostHandler)
  .openapi(itemPatchRoute, itemPatchHandler)
  .openapi(itemDeleteRoute, itemDeleteHandler);

export default router;
