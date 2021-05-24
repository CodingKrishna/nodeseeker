import { graphqlHTTP } from 'express-graphql'
import { GraphQLSchema, GraphQLString, GraphQLObjectType, GraphQLNonNull, GraphQLList } from 'graphql'
import { fetchFund, fetchFundByName, fetchAllFunds } from '../service/navService.js'

const FundType = new GraphQLObjectType({
    name: 'Fund',
    description: 'Represents a single fund.',
    fields: () => ({
        schemeCode: { type: GraphQLNonNull(GraphQLString) },
        schemeName: { type: GraphQLNonNull(GraphQLString) },
        nav: { type: GraphQLNonNull(GraphQLString) },
        date: { type: GraphQLNonNull(GraphQLString) },
        updatedAt: { type: GraphQLNonNull(GraphQLString) }
    })
})

const RootQueryType = new GraphQLObjectType({
    name: 'Query',
    description: 'Root Query',
    fields: () => ({
        fund: {
            type: GraphQLList(FundType),
            description: 'Get fund(s) by schemeCode or schemeName.',
            args: {
                schemeCode: { type: GraphQLString },
                schemeName: { type: GraphQLString }
            },
            resolve: async (parent, args) => {
                if (args.schemeCode) {
                    const response = await fetchFund(args.schemeCode, false)
                    return [JSON.parse(response)]
                }
                if (args.schemeName) {
                    return await fetchFundByName(args.schemeName)
                }
            }
        },
        funds: {
            type: GraphQLList(FundType),
            description: 'Get all funds.',
            resolve: () => fetchAllFunds()
        }
    })
})

const graphql = graphqlHTTP({
    schema: new GraphQLSchema({
        query: RootQueryType,
    }),
    graphiql: true
})

export default graphql