
import mongoose from 'mongoose';
import db from '../../connections/dbMaster.js';

const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const fileType = {
    contentType: {
      type: String,
    },
    key: { type: String },
    path: { type: String },
    url: { type: String },
    sizeInMegaByte: Number,
  };

const ProposalSchema = new Schema({
    title: {type: String, required:true},
    votingStartDate: { type: Date, required: true },
    votingEndDate: { type: Date, required: true },
    voteOptions:{
        type:[{
            label: String,
            selected: Boolean
        }],
        required: true
    },
    summary: String,
    description: String,
    documents: {
        type: [fileType],
        default: [],
      },
    _createdBy: { type: ObjectId, ref: 'user', select: false },
    _updatedBy: { type: ObjectId, ref: 'user', select: false }
},
    {
        versionKey: false,
        timestamps: true,
        collection: 'proposals',
    }
)

export default db.model('proposals', ProposalSchema);
