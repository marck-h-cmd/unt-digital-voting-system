import { GraphQLScalarType } from "graphql";

export const GraphQLJSON = new GraphQLScalarType({
  name: "JSON",
  description: "JSON custom scalar type",
  serialize(value) {
    return value;
  },
  parseValue(value) {
    return value;
  },
  parseLiteral(ast: any) {
    return ast.value;
  },
});
