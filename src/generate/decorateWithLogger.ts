import { defaultFieldResolver, GraphQLFieldResolver } from 'graphql';
import { VError } from 'verror';
import { ILogger } from '../Interfaces';

/*
 * fn: The function to decorate with the logger
 * logger: an object instance of type Logger
 * hint: an optional hint to add to the error's message
 */
function decorateWithLogger(
  fn: GraphQLFieldResolver<any, any> | undefined,
  logger: ILogger,
  hint: string,
): GraphQLFieldResolver<any, any> {
  if (typeof fn === 'undefined') {
    fn = defaultFieldResolver;
  }

  const logError = (e: Error) => {
    let newMessage = 'Error in resolver';
    if (hint) {
      newMessage = `${newMessage} ${hint}`;
    }
    logger.log(new VError(e, newMessage));
  };

  return (root, args, ctx, info) => {
    try {
      const result = fn(root, args, ctx, info);
      // If the resolve function returns a Promise log any Promise rejects.
      if (
        result &&
        typeof result.then === 'function' &&
        typeof result.catch === 'function'
      ) {
        result.catch((reason: Error | string) => {
          // make sure that it's an error we're logging.
          const error = reason instanceof Error ? reason : new Error(reason);
          logError(error);

          // We don't want to leave an unhandled exception so pass on error.
          return reason;
        });
      }
      return result;
    } catch (e) {
      logError(e);
      // we want to pass on the error, just in case.
      throw e;
    }
  };
}

export default decorateWithLogger;
