import { Request, Response, NextFunction, RequestHandler } from "express";

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// export const asyncHandler = (
//   (fn: any) => {
//     return (req: Request, res: Response, next: NextFunction) => {
//       Promise.resolve(fn(req, res, next)).catch(next);
//     };
//   });

// const asyncHandler = (fn) => {
//     return (req, res, next) => {
//         Promise
//             .resolve(fn(req, res, next))
//             .catch((error) => next(error))
//     }
// }

